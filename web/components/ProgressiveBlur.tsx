'use client'

import {useEffect, useRef, type RefObject} from 'react'
import {proxyAsset} from '@/lib/assetProxy'

/**
 * WebGL progressive blur — a port of the Codrops / OGL "WebGL Progressive Blur"
 * effect (tympanus.net/Tutorials/WebGLProgressiveBlur), adapted to overlay
 * individual DOM media frames in this app rather than drive a full-page grid.
 *
 * What it does, faithfully to the demo:
 *  • A circular multi-tap blur in the fragment shader (soft, bokeh-ish — not a
 *    box blur).
 *  • The blur strength is driven by a *viewport-space* vertical gradient: the
 *    band crossing the centre of the screen stays sharp and the blur ramps up
 *    toward the top AND bottom of the viewport. Because the gradient is keyed to
 *    where the frame sits on screen, the effect glides as you scroll — a frame
 *    is sharp as it passes mid-screen and melts as it nears either edge.
 *  • Works over both images and video. Images are loaded here as their own
 *    CORS-clean texture; video is sampled live from a <video> element each
 *    frame, so it stays in motion under the blur.
 *
 * Integration notes:
 *  • Render this as the LAST child of a `relative overflow-hidden` media frame.
 *    The canvas covers the frame and, once its texture is ready, fades in over
 *    the underlying DOM media — which it reproduces exactly where the blur is
 *    zero, so the hand-off is seamless. If WebGL is unavailable or the texture
 *    can't be read (e.g. a cross-origin source), the canvas simply never shows
 *    and the untouched DOM media stays visible. `onUnavailable` fires in that
 *    case so a caller can react (e.g. reveal a plain <video>).
 *  • WebGL contexts are created lazily when the frame nears the viewport and
 *    torn down when it leaves — browsers cap simultaneous contexts (~16), and a
 *    long case study can hold far more media than that.
 *
 * Cross-origin caveat: a WebGL texture can only be read from same-origin or
 * CORS-enabled sources. That covers Sanity-hosted images/video, but NOT
 * third-party <iframe> embeds (Vimeo/YouTube) — those can't be sampled by any
 * WebGL approach, so they're left sharp.
 */

interface Props {
  /** Image URL to texture. The component loads its own crossorigin copy. */
  imageSrc?: string
  /** Live <video> to sample each frame. Must be a CORS-clean source. */
  videoRef?: RefObject<HTMLVideoElement | null>
  /** Extra classes for the canvas (positioning overrides etc.). */
  className?: string
  /** Overall blur multiplier. 1 = tuned default; lower is subtler. */
  intensity?: number
  /** Max blur radius as a fraction of the image (before the gradient/intensity). */
  maxBlur?: number
  /**
   * Half-width of the sharp band at screen centre, 0–1 of the viewport. 0.5
   * keeps roughly the centre half crisp and only softens near the screen
   * edges; smaller = more of the frame blurs.
   */
  center?: number
  /** Called if WebGL can't run or the texture can't be read (→ stays sharp). */
  onUnavailable?: () => void
}

// ── Shared animation loop ────────────────────────────────────────────────────
// One rAF drives every live instance; it idles when none are on screen.

interface Instance {
  render: () => void
}

const liveInstances = new Set<Instance>()
let rafId = 0

function frame() {
  liveInstances.forEach((i) => i.render())
  rafId = liveInstances.size > 0 ? requestAnimationFrame(frame) : 0
}

function ensureLoop() {
  if (!rafId && liveInstances.size > 0) rafId = requestAnimationFrame(frame)
}

// ── Shaders ──────────────────────────────────────────────────────────────────

const VERT = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const FRAG = `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D tMap;
  uniform vec2 uImageSize;   // natural texture size
  uniform vec2 uPlaneSize;   // canvas size in device px
  uniform float uViewportH;  // window inner height
  uniform float uRectTop;    // frame top in viewport px
  uniform float uRectH;      // frame height in viewport px
  uniform float uMaxBlur;
  uniform float uIntensity;
  uniform float uCenter;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // object-cover remap so the texture fills the frame like CSS background-cover
    vec2 ratio = vec2(
      min((uPlaneSize.x / uPlaneSize.y) / (uImageSize.x / uImageSize.y), 1.0),
      min((uPlaneSize.y / uPlaneSize.x) / (uImageSize.y / uImageSize.x), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Viewport-space vertical gradient: 0 across the centre band, ramping to 1
    // toward the top AND bottom of the screen. vUv.y = 1 at the frame's top.
    float screenY = uRectTop + (1.0 - vUv.y) * uRectH;
    float vp = clamp(screenY / uViewportH, 0.0, 1.0);
    float d = smoothstep(uCenter, 1.0, abs(vp - 0.5) * 2.0);

    float strength = uMaxBlur * d * uIntensity;

    // Crisp centre band: skip the loop entirely where there's no blur.
    if (strength < 0.0008) {
      gl_FragColor = vec4(texture2D(tMap, uv).rgb, 1.0);
      return;
    }

    // Keep the sample disc circular in screen space despite non-square frames.
    float aspect = uPlaneSize.y / uPlaneSize.x;

    vec3 col = vec3(0.0);
    const float REPEATS = 18.0;
    for (float i = 0.0; i < REPEATS; i++) {
      float a = radians((i / REPEATS) * 360.0);
      vec2 dir = vec2(cos(a) * aspect, sin(a));
      // two jittered taps per angle smooth out the disc (as in the demo)
      float r1 = rand(vec2(i, vUv.x + vUv.y)) * 0.5 + 0.5;
      float r2 = rand(vec2(i + 2.0, vUv.x + vUv.y + 24.0)) * 0.5 + 0.5;
      col += texture2D(tMap, uv + dir * strength * r1).rgb * 0.5;
      col += texture2D(tMap, uv + dir * strength * r2).rgb * 0.5;
    }
    col /= REPEATS;

    gl_FragColor = vec4(col, 1.0);
  }
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  return sh
}

export function ProgressiveBlur({
  imageSrc,
  videoRef,
  className = '',
  intensity = 1,
  maxBlur = 0.018,
  center = 0.7,
  onUnavailable,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Resources for the active WebGL context (null while torn down / offscreen).
    let ctx: {
      gl: WebGLRenderingContext
      tex: WebGLTexture
      u: Record<string, WebGLUniformLocation | null>
      image: HTMLImageElement | null
      texW: number
      texH: number
      ready: boolean
    } | null = null
    let instance: Instance | null = null
    let failed = false

    function fail() {
      failed = true
      teardown()
      canvas!.style.opacity = '0'
      onUnavailable?.()
    }

    function setup() {
      if (ctx || failed) return
      const gl = canvas!.getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
      })
      if (!gl) {
        fail()
        return
      }

      const prog = gl.createProgram()!
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        fail()
        return
      }
      gl.useProgram(prog)

      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      // two triangles covering clip space
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      )
      const loc = gl.getAttribLocation(prog, 'position')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

      const u = {
        tMap: gl.getUniformLocation(prog, 'tMap'),
        uImageSize: gl.getUniformLocation(prog, 'uImageSize'),
        uPlaneSize: gl.getUniformLocation(prog, 'uPlaneSize'),
        uViewportH: gl.getUniformLocation(prog, 'uViewportH'),
        uRectTop: gl.getUniformLocation(prog, 'uRectTop'),
        uRectH: gl.getUniformLocation(prog, 'uRectH'),
        uMaxBlur: gl.getUniformLocation(prog, 'uMaxBlur'),
        uIntensity: gl.getUniformLocation(prog, 'uIntensity'),
        uCenter: gl.getUniformLocation(prog, 'uCenter'),
      }

      const tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.uniform1i(u.tMap, 0)

      ctx = {gl, tex, u, image: null, texW: 1, texH: 1, ready: false}

      if (imageSrc) {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => {
          if (!ctx) return
          ctx.image = image
          ctx.texW = image.naturalWidth
          ctx.texH = image.naturalHeight
          uploadImage()
        }
        image.onerror = () => fail()
        // Same-origin proxy: cdn.sanity.io rejects CORS requests, which would
        // taint the texture. See lib/assetProxy.ts.
        image.src = proxyAsset(imageSrc)
      }
    }

    function uploadImage() {
      if (!ctx || !ctx.image) return
      const {gl, tex} = ctx
      gl.bindTexture(gl.TEXTURE_2D, tex)
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, ctx.image)
      } catch {
        fail()
        return
      }
      ctx.ready = true
    }

    function teardown() {
      if (instance) {
        liveInstances.delete(instance)
        instance = null
      }
      if (ctx) {
        const {gl, tex} = ctx
        gl.deleteTexture(tex)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
        ctx = null
      }
    }

    function render() {
      if (!ctx || failed) return
      const {gl, tex, u} = ctx

      // Pull a fresh video frame each tick.
      const video = videoRef?.current
      if (video) {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          ctx.texW = video.videoWidth
          ctx.texH = video.videoHeight
          gl.bindTexture(gl.TEXTURE_2D, tex)
          try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video)
          } catch {
            fail()
            return
          }
          ctx.ready = true
        }
      }
      if (!ctx.ready) return

      const rect = canvas!.getBoundingClientRect()
      const vh = window.innerHeight
      // Skip work while fully off screen (context is kept; just don't draw).
      if (rect.bottom <= 0 || rect.top >= vh) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(canvas!.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas!.clientHeight * dpr))
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w
        canvas!.height = h
      }

      gl.viewport(0, 0, canvas!.width, canvas!.height)
      gl.uniform2f(u.uImageSize, ctx.texW, ctx.texH)
      gl.uniform2f(u.uPlaneSize, canvas!.width, canvas!.height)
      gl.uniform1f(u.uViewportH, vh)
      gl.uniform1f(u.uRectTop, rect.top)
      gl.uniform1f(u.uRectH, rect.height)
      gl.uniform1f(u.uMaxBlur, maxBlur)
      gl.uniform1f(u.uIntensity, intensity)
      gl.uniform1f(u.uCenter, center)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      if (canvas!.style.opacity !== '1') canvas!.style.opacity = '1'
    }

    // Create the context only while the frame is near the viewport; drop it
    // once well clear so we never blow the browser's context budget.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!ctx && !failed) {
            setup()
            if (ctx) {
              instance = {render}
              liveInstances.add(instance)
              ensureLoop()
            }
          }
        } else if (ctx) {
          teardown()
          canvas.style.opacity = '0'
        }
      },
      {rootMargin: '300px'},
    )
    io.observe(canvas)

    return () => {
      io.disconnect()
      teardown()
    }
  }, [imageSrc, videoRef, intensity, maxBlur, center, onUnavailable])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 ${className}`}
    />
  )
}
