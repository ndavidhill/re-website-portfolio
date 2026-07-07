'use client'

import {useEffect, useRef, useState} from 'react'
import {gsap} from 'gsap'
import {useReducedMotion} from 'framer-motion'
import {urlForImage, type SanityImage} from '@/lib/sanity'
import {PlayLightbox} from './PlayLightbox'

export interface LayerItem {
  caption: string
  ratio: '4/5' | '1/1' | '16/9'
  color: string
  image?: SanityImage
  videoUrl?: string
  poster?: SanityImage
  /** Tapping the tile opens the item full-screen in a lightbox. */
  lightbox?: boolean
}

// ──────────────────────────────────────────────────────────────────────────────
// Motion model — ported from Jorge Toloza's "Infinite Layers Grid" (Codrops),
// adapted to React + Sanity media. DOM tiles are translated each frame over a
// lerp-smoothed 2D scroll; per-tile random `ease` gives the layered parallax
// depth; the strip is tiled and wrapped by ±pattern size for the infinite
// illusion. On top of the reference: flick momentum on release, an idle-sleep
// for the render loop, decoder-deduped video playback, lazy media, and
// tap-to-open lightbox tiles.
// ──────────────────────────────────────────────────────────────────────────────

const SCROLL_EASE = 0.06
const WHEEL_FACTOR = 0.4
const DELTA_EASE = 0.04
const MOUSE_EASE = 0.04
const DRIFT_GAIN = 5 // scroll-velocity push multiplier
const MOUSE_PARALLAX = 0.6 // cursor parallax as a fraction of tile size
const IMG_OVERSCALE = 1.2 // base image zoom so inner parallax never shows edges
const PRESS_ZOOM = 0.2 // extra zoom while dragging

/** Seconds of release velocity projected into the target on a flick. */
const FLICK_PROJECT = 0.22
/** Max projected flick distance (px) so a violent swipe can't launch to nowhere. */
const FLICK_MAX = 1400
/** Pointer travel (px) beyond which a gesture is a drag, not a tap. */
const TAP_SLOP = 6
/** Settled frames before the render loop goes to sleep. */
const SLEEP_AFTER_FRAMES = 45

const ASPECT: Record<LayerItem['ratio'], number> = {'4/5': 0.8, '1/1': 1, '16/9': 16 / 9}

/** Deterministic pseudo-random in [0,1) — keeps the scatter stable across renders. */
function rnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Virtual layout space the hand-tuned scatter is authored in. */
const CW = 1600
const CH = 1200

interface BaseTile {
  item: LayerItem
  x: number
  y: number
  w: number
  h: number
}

interface PhysTile {
  x: number
  y: number
  w: number
  h: number
  ease: number
  extraX: number
  extraY: number
}

interface Props {
  items: LayerItem[]
}

/**
 * Build the base scatter in virtual space: a jittered grid (one tile per cell)
 * for reliable coverage, but loosened toward the reference's airy, organic feel.
 *
 * Two things matter with little content:
 *  - Density is kept low (≈2× the item count) so each item appears only a couple
 *    of times per pattern, well spaced — its true repeat then falls a full
 *    viewport away, at the tiling edges, not in close proximity.
 *  - Item→cell assignment is randomised but constrained so no cell shares its
 *    media with the cell to its left or above. That breaks the columnar
 *    stacking you get when the column count divides the item count.
 */
function buildBase(items: LayerItem[]): BaseTile[] {
  const n = items.length
  if (n === 0) return []

  // Airy but gap-free density.
  const target = Math.min(24, Math.max(14, Math.round(n * 2.5)))
  const cols = Math.max(2, Math.round(Math.sqrt(target * (CW / CH))))
  const rows = Math.max(2, Math.ceil(target / cols))
  const cells = cols * rows
  const cellW = CW / cols
  const cellH = CH / rows

  // Assign media to cells from a *balanced* bag (every item used an equal number
  // of times), deterministically shuffled, then repaired so no cell shares its
  // media with any 4-neighbour.
  const assign: number[] = Array.from({length: cells}, (_, k) => k % n)
  for (let k = cells - 1; k > 0; k--) {
    const j = Math.floor(rnd(k * 13 + 555) * (k + 1))
    ;[assign[k], assign[j]] = [assign[j], assign[k]]
  }
  const conflicts = (i: number, val: number) => {
    const c = i % cols
    const r = (i / cols) | 0
    return (
      (c > 0 && assign[i - 1] === val) ||
      (c < cols - 1 && assign[i + 1] === val) ||
      (r > 0 && assign[i - cols] === val) ||
      (r < rows - 1 && assign[i + cols] === val)
    )
  }
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < cells; i++) {
      if (!conflicts(i, assign[i])) continue
      for (let off = 1; off < cells; off++) {
        const j = (i + off) % cells
        if (
          assign[j] !== assign[i] &&
          !conflicts(i, assign[j]) &&
          !conflicts(j, assign[i])
        ) {
          ;[assign[i], assign[j]] = [assign[j], assign[i]]
          break
        }
      }
    }
  }

  const out: BaseTile[] = []
  let i = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const item = items[assign[i]]
      const ar = ASPECT[item.ratio]
      let h = cellH * (0.62 + rnd(i + 1) * 0.4) // 0.62–1.02 of the cell
      let w = h * ar
      const maxW = cellW * 1.1
      if (w > maxW) {
        w = maxW
        h = w / ar
      }
      // Jitter (±0.4 cell) for an organic, non-gridded rest state.
      const cx = (col + 0.5) * cellW + (rnd(i + 41) - 0.5) * cellW * 0.8
      const cy = (row + 0.5) * cellH + (rnd(i + 99) - 0.5) * cellH * 0.8
      out.push({item, x: cx - w / 2, y: cy - h / 2, w, h})
      i++
    }
  }
  return out
}

interface RenderTile {
  key: string
  item: LayerItem
  w: number
  h: number
  /** In the initial viewport → load media immediately; others load lazily. */
  eager: boolean
}

export function LayersGrid({items}: Props) {
  const reduce = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  // Rendered tiles (computed client-side from viewport + content).
  const [tiles, setTiles] = useState<RenderTile[]>([])
  // Origin element is captured at open time (refs must not be read in render).
  const [lightbox, setLightbox] = useState<{idx: number; el: HTMLElement | null} | null>(
    null,
  )

  // Per-tile physics + element refs, aligned by index with `tiles`.
  const physRef = useRef<PhysTile[]>([])
  const elRef = useRef<Array<HTMLDivElement | null>>([])
  const wrapRef = useRef<Array<HTMLDivElement | null>>([])
  const imgRef = useRef<Array<HTMLElement | null>>([])
  const frameRef = useRef<Array<HTMLDivElement | null>>([])

  // Interaction state (mutable across frames).
  const stateRef = useRef({
    scroll: {
      cur: {x: 0, y: 0},
      target: {x: 0, y: 0},
      last: {x: 0, y: 0},
      delta: {cx: 0, cy: 0},
    },
    mouse: {tx: 0.5, ty: 0.5, cx: 0.5, cy: 0.5, pressT: 0, pressC: 0},
    drag: {active: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0, moved: false},
    wrapX: 0,
    wrapY: 0,
    built: false,
  })
  const introDone = useRef(false)
  // Loop controls exposed to React (lightbox freeze/thaw). Assigned per effect run.
  const controlsRef = useRef<{wake: () => void; freeze: () => void; thaw: () => void}>({
    wake: () => {},
    freeze: () => {},
    thaw: () => {},
  })
  const frozenRef = useRef(false)

  // ── Layout: (re)build tiles from viewport size + content ──────────────────
  useEffect(() => {
    if (reduce) return
    const base = buildBase(items)
    if (base.length === 0) return

    let raf = 0
    const build = () => {
      const winW = window.innerWidth
      const winH = window.innerHeight
      // Uniform scale keyed to the dominant axis so ONE pattern copy covers
      // the viewport both ways (portrait phones included).
      const k = Math.max(winW / CW, winH / CH)
      const patternW = CW * k
      const patternH = CH * k

      const nx = Math.max(2, Math.ceil(winW / patternW) + 1)
      const ny = Math.max(2, Math.ceil(winH / patternH) + 1)

      const s = stateRef.current
      // Initial offset so the seam isn't centred — only on the first build.
      // Rebuilds (resize/rotate) keep the current scroll so the user isn't
      // teleported back to the origin; wrapping tolerates any offset.
      if (!s.built) {
        const ox = -winW * 0.1
        const oy = -winH * 0.1
        s.scroll.cur = {x: ox, y: oy}
        s.scroll.target = {x: ox, y: oy}
        s.scroll.last = {x: ox, y: oy}
        s.built = true
      }

      const phys: PhysTile[] = []
      const rendered: RenderTile[] = []
      const margin = 0.2 // eager-load a little beyond the first viewport

      base.forEach((b, bi) => {
        const w = b.w * k
        const h = b.h * k
        for (let ix = 0; ix < nx; ix++) {
          for (let iy = 0; iy < ny; iy++) {
            const x = b.x * k + ix * patternW
            const y = b.y * k + iy * patternH
            const ex = x + s.scroll.cur.x
            const ey = y + s.scroll.cur.y
            const eager =
              ex > -winW * margin - w &&
              ex < winW * (1 + margin) &&
              ey > -winH * margin - h &&
              ey < winH * (1 + margin)
            phys.push({
              x,
              y,
              w,
              h,
              ease: ((bi * 7 + ix * 13 + iy * 29) % 100) / 200 + 0.5, // 0.5–1.0, stable
              extraX: 0,
              extraY: 0,
            })
            rendered.push({key: `${bi}-${ix}-${iy}`, item: b.item, w, h, eager})
          }
        }
      })

      s.wrapX = nx * patternW
      s.wrapY = ny * patternH

      physRef.current = phys
      elRef.current = new Array(rendered.length).fill(null)
      wrapRef.current = new Array(rendered.length).fill(null)
      imgRef.current = new Array(rendered.length).fill(null)
      frameRef.current = new Array(rendered.length).fill(null)
      introDone.current = false
      setTiles(rendered)
    }

    build()
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(build)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [items, reduce])

  // ── Animation + interaction: runs once tiles (and their refs) are mounted ──
  useEffect(() => {
    if (reduce || tiles.length === 0) return
    const container = containerRef.current
    if (!container) return

    const s = stateRef.current

    // Intro: tiles currently on screen fly in from the viewport centre. When
    // it settles, drop the wrappers' will-change — they never move again, and
    // ~64 fewer composited layers is real GPU memory back.
    let introSettled = introDone.current
    const releaseIntroLayers = () => {
      introSettled = true
      wrapRef.current.forEach((w) => {
        if (w) w.style.willChange = 'auto'
      })
    }
    if (!introDone.current) {
      introDone.current = true
      const winW = window.innerWidth
      const winH = window.innerHeight
      const visible: HTMLElement[] = []
      wrapRef.current.forEach((wrap, i) => {
        const el = elRef.current[i]
        if (!wrap || !el) return
        const p = physRef.current[i]
        const px = p.x + s.scroll.cur.x
        const py = p.y + s.scroll.cur.y
        if (px > -p.w && px < winW + p.w && py > -p.h && py < winH + p.h) {
          const tx = -px + winW * 0.5 - p.w * 0.5
          const ty = -py + winH * 0.5 - p.h * 0.5
          gsap.set(wrap, {x: tx, y: ty})
          visible.push(wrap)
        }
      })
      if (visible.length > 0) {
        gsap.to(visible.reverse(), {
          duration: 2,
          ease: 'expo.inOut',
          x: 0,
          y: 0,
          stagger: 0.05,
          onComplete: releaseIntroLayers,
        })
      } else {
        releaseIntroLayers()
      }
    }

    // ── Render loop with idle sleep ─────────────────────────────────────────
    // When everything is settled (no drag, lerps converged, parallax at rest)
    // the loop stops scheduling itself — zero style writes, zero compositing —
    // and any input wakes it. The canvas is indistinguishable at rest.
    let raf = 0
    let running = false
    let idleFrames = 0

    const tick = () => {
      if (frozenRef.current) {
        running = false
        return
      }
      const sc = s.scroll
      sc.cur.x += (sc.target.x - sc.cur.x) * SCROLL_EASE
      sc.cur.y += (sc.target.y - sc.cur.y) * SCROLL_EASE

      sc.delta.cx += (sc.cur.x - sc.last.x - sc.delta.cx) * DELTA_EASE
      sc.delta.cy += (sc.cur.y - sc.last.y - sc.delta.cy) * DELTA_EASE
      s.mouse.cx += (s.mouse.tx - s.mouse.cx) * MOUSE_EASE
      s.mouse.cy += (s.mouse.ty - s.mouse.cy) * MOUSE_EASE
      s.mouse.pressC += (s.mouse.pressT - s.mouse.pressC) * MOUSE_EASE

      const dirX = sc.cur.x > sc.last.x ? 1 : -1 // 1 = right
      const dirY = sc.cur.y > sc.last.y ? 1 : -1 // 1 = down
      const winW = window.innerWidth
      const winH = window.innerHeight

      const phys = physRef.current
      for (let i = 0; i < phys.length; i++) {
        const p = phys[i]
        const el = elRef.current[i]
        const img = imgRef.current[i]
        if (!el) continue

        const newX =
          DRIFT_GAIN * sc.delta.cx * p.ease + (s.mouse.cx - 0.5) * p.w * MOUSE_PARALLAX
        const newY =
          DRIFT_GAIN * sc.delta.cy * p.ease + (s.mouse.cy - 0.5) * p.h * MOUSE_PARALLAX

        let posX = p.x + sc.cur.x + p.extraX + newX
        let posY = p.y + sc.cur.y + p.extraY + newY

        if (dirX === 1 && posX > winW) p.extraX -= s.wrapX
        if (dirX === -1 && posX + p.w < 0) p.extraX += s.wrapX
        if (dirY === 1 && posY > winH) p.extraY -= s.wrapY
        if (dirY === -1 && posY + p.h < 0) p.extraY += s.wrapY

        posX = p.x + sc.cur.x + p.extraX + newX
        posY = p.y + sc.cur.y + p.extraY + newY
        el.style.transform = `translate(${posX}px, ${posY}px)`

        // Inner parallax only matters when the tile can be seen — skip the
        // second style write for tiles well outside the viewport.
        if (
          img &&
          posX > -p.w * 1.5 &&
          posX < winW + p.w * 0.5 &&
          posY > -p.h * 1.5 &&
          posY < winH + p.h * 0.5
        ) {
          const z = IMG_OVERSCALE + PRESS_ZOOM * s.mouse.pressC * p.ease
          const mx = -s.mouse.cx * p.ease * 10
          const my = -s.mouse.cy * p.ease * 10
          img.style.transform = `scale(${z}) translate(${mx}%, ${my}%)`
        }
      }

      sc.last.x = sc.cur.x
      sc.last.y = sc.cur.y

      // Sleep when settled: lerp gaps, drift, parallax chase and press all ~0.
      const activity =
        Math.abs(sc.target.x - sc.cur.x) +
        Math.abs(sc.target.y - sc.cur.y) +
        Math.abs(sc.delta.cx) +
        Math.abs(sc.delta.cy) +
        (Math.abs(s.mouse.tx - s.mouse.cx) + Math.abs(s.mouse.ty - s.mouse.cy)) * 200 +
        Math.abs(s.mouse.pressT - s.mouse.pressC) * 20
      if (!s.drag.active && introSettled && activity < 0.5) idleFrames++
      else idleFrames = 0
      if (idleFrames > SLEEP_AFTER_FRAMES) {
        running = false
        return
      }
      raf = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (running || frozenRef.current) return
      running = true
      idleFrames = 0
      raf = requestAnimationFrame(tick)
    }
    wake()

    // ── Events ──────────────────────────────────────────────────────────────
    // Momentum: velocity is sampled from the last two pointer moves and
    // projected into the target on release, so a flick coasts and eases out
    // instead of dying where the finger stopped.
    let moveA = {t: 0, x: 0, y: 0}
    let moveB = {t: 0, x: 0, y: 0}

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      s.scroll.target.x -= e.deltaX * WHEEL_FACTOR
      s.scroll.target.y -= e.deltaY * WHEEL_FACTOR
      wake()
    }
    const onPointerDown = (e: PointerEvent) => {
      s.drag.active = true
      s.drag.moved = false
      s.mouse.pressT = 1
      s.drag.startX = e.clientX
      s.drag.startY = e.clientY
      s.drag.scrollX = s.scroll.target.x
      s.drag.scrollY = s.scroll.target.y
      moveA = moveB = {t: performance.now(), x: e.clientX, y: e.clientY}
      document.documentElement.classList.add('grabbing')
      wake()
    }
    const onPointerMove = (e: PointerEvent) => {
      s.mouse.tx = e.clientX / window.innerWidth
      s.mouse.ty = e.clientY / window.innerHeight
      if (s.drag.active) {
        const dx = e.clientX - s.drag.startX
        const dy = e.clientY - s.drag.startY
        if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) s.drag.moved = true
        s.scroll.target.x = s.drag.scrollX + dx
        s.scroll.target.y = s.drag.scrollY + dy
        moveA = moveB
        moveB = {t: performance.now(), x: e.clientX, y: e.clientY}
      }
      wake()
    }
    const onPointerUp = () => {
      if (s.drag.active && s.drag.moved) {
        const dt = moveB.t - moveA.t
        // Only flick when the last movement was recent and fast enough to
        // read as a throw (a held-then-released drag shouldn't coast).
        if (dt > 0 && dt < 80 && performance.now() - moveB.t < 80) {
          const vx = ((moveB.x - moveA.x) / dt) * 1000 // px/s
          const vy = ((moveB.y - moveA.y) / dt) * 1000
          const clamp = (v: number) =>
            Math.max(-FLICK_MAX, Math.min(FLICK_MAX, v * FLICK_PROJECT))
          s.scroll.target.x += clamp(vx)
          s.scroll.target.y += clamp(vy)
        }
      }
      s.drag.active = false
      s.mouse.pressT = 0
      document.documentElement.classList.remove('grabbing')
      // Clear the drag flag AFTER the browser dispatches the click this
      // pointerup produces (click is what tile buttons listen to) — the click
      // from a real drag must be swallowed, but the next interaction (or a
      // keyboard Enter) must not be.
      window.setTimeout(() => {
        s.drag.moved = false
      }, 0)
      wake()
    }

    container.addEventListener('wheel', onWheel, {passive: false})
    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // Caption reveal as tiles enter view.
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => en.target.classList.toggle('lg-visible', en.isIntersecting)),
      {root: container, threshold: 0.05},
    )
    container.querySelectorAll('.lg-caption').forEach((c) => io.observe(c))

    // Lazy media: off-viewport tiles rendered without src (images) so the
    // initial burst is only what's visible; promote as they approach.
    const lazyIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return
          const el = en.target as HTMLImageElement
          if (el.dataset.src) {
            el.src = el.dataset.src
            delete el.dataset.src
          }
          lazyIo.unobserve(el)
        })
      },
      {root: container, rootMargin: '60%'},
    )
    container.querySelectorAll('img[data-src]').forEach((el) => lazyIo.observe(el))

    // Decoder economy: every tile copy is its own <video>, but copies of the
    // same file don't each need a decode pipeline — among visible videos, play
    // ONE per unique source (up to a hardware-realistic cap); the rest hold
    // their current frame. At tile size the difference is invisible.
    const MAX_PLAYING = window.innerWidth < 768 ? 8 : 16
    const visibleVids = new Set<HTMLVideoElement>()
    const syncPlayback = () => {
      if (frozenRef.current) return
      const playingSrc = new Set<string>()
      let n = 0
      visibleVids.forEach((v) => {
        if (n < MAX_PLAYING && !playingSrc.has(v.src)) {
          playingSrc.add(v.src)
          v.play().catch(() => {})
          n++
        } else {
          v.pause()
        }
      })
    }
    const vidIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const v = en.target as HTMLVideoElement
          if (en.isIntersecting) {
            visibleVids.add(v)
          } else {
            visibleVids.delete(v)
            v.pause()
          }
        })
        syncPlayback()
      },
      {root: container, rootMargin: '15%'},
    )
    container.querySelectorAll('video').forEach((v) => vidIo.observe(v))

    // Returning to a backgrounded tab: the browser paused the videos and no
    // intersection change will replay them — resync (and re-wake) ourselves.
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !frozenRef.current) {
        syncPlayback()
        wake()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Lightbox handshake: freeze the whole canvas (loop + playback) while a
    // dialog is open; thaw resumes both.
    controlsRef.current = {
      wake,
      freeze: () => {
        frozenRef.current = true
        container.querySelectorAll('video').forEach((v) => v.pause())
      },
      thaw: () => {
        frozenRef.current = false
        syncPlayback()
        wake()
      },
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      io.disconnect()
      lazyIo.disconnect()
      vidIo.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      document.documentElement.classList.remove('grabbing')
    }
  }, [tiles, reduce])

  // Freeze/thaw the canvas around the lightbox.
  useEffect(() => {
    if (lightbox != null) controlsRef.current.freeze()
    else controlsRef.current.thaw()
  }, [lightbox])

  const openLightbox = (i: number) => {
    // A drag that happened to end on a tile must not open it.
    if (stateRef.current.drag.moved) return
    setLightbox({idx: i, el: frameRef.current[i]})
  }

  // ── Reduced motion: a plain, accessible scrollable grid ───────────────────
  if (reduce) {
    return (
      <div className="px-3 pt-[110px] md:px-[30px]">
        <ul role="list" className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((item, i) => {
            const frame = (
              <div
                className="relative overflow-hidden rounded-[4px] md:rounded-[12px]"
                style={{aspectRatio: item.ratio, backgroundColor: item.color}}
              >
                <TileMedia item={item} />
              </div>
            )
            return (
              <li key={i} className="flex flex-col gap-3">
                {item.lightbox ? (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`Open ${item.caption}`}
                    onClick={() => setLightbox({idx: i, el: null})}
                    className="block w-full cursor-zoom-in rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 md:rounded-[12px]"
                  >
                    {frame}
                  </button>
                ) : (
                  frame
                )}
                <small className="text-xs leading-4 tracking-[-0.084px] text-text-secondary">
                  {item.caption}
                </small>
              </li>
            )
          })}
        </ul>
        {lightbox != null && items[lightbox.idx] && (
          <PlayLightbox
            item={items[lightbox.idx]}
            originEl={null}
            onClose={() => setLightbox(null)}
          />
        )}
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        role="region"
        aria-label="Infinite gallery — drag or scroll to explore"
        className="fixed inset-0 h-[100dvh] w-full cursor-grab select-none overflow-hidden [html.grabbing_&]:cursor-grabbing"
        style={{touchAction: 'none'}}
      >
        {tiles.map((t, i) => {
          const frame = (
            <div
              ref={(el) => {
                frameRef.current[i] = el
              }}
              className={
                'relative overflow-hidden rounded-[4px] md:rounded-[12px]' +
                (t.item.lightbox
                  ? ' transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tile:scale-[1.02] group-focus-visible/tile:scale-[1.02]'
                  : '')
              }
              style={{width: t.w, height: t.h, backgroundColor: t.item.color}}
            >
              <TileMedia
                item={t.item}
                mediaRef={(el) => {
                  imgRef.current[i] = el
                }}
                requestWidth={mediaWidth(t.w)}
                observed
                eager={t.eager}
              />
            </div>
          )
          return (
            <div
              key={t.key}
              ref={(el) => {
                elRef.current[i] = el
              }}
              className="absolute left-0 top-0 will-change-transform"
              style={{width: t.w}}
            >
              <div
                ref={(el) => {
                  wrapRef.current[i] = el
                }}
                className="will-change-transform"
              >
                {t.item.lightbox ? (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`Open ${t.item.caption}`}
                    onClick={() => openLightbox(i)}
                    className="group/tile block w-full cursor-zoom-in rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40 md:rounded-[12px]"
                  >
                    {frame}
                  </button>
                ) : (
                  frame
                )}
                <small className="lg-caption mt-3 block max-w-full overflow-hidden text-[11px] leading-[1.3] tracking-[-0.084px] text-text-secondary md:text-xs">
                  <span className="lg-caption-inner block">{t.item.caption}</span>
                </small>
              </div>
            </div>
          )
        })}
      </div>
      {lightbox != null && tiles[lightbox.idx] && (
        <PlayLightbox
          item={tiles[lightbox.idx].item}
          originEl={lightbox.el}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}

/**
 * Sanity request width for a tile rendered at `tileW` CSS px — accounts for
 * the parallax over-scale and (capped) devicePixelRatio, then snaps to shared
 * steps so duplicate tiles hit the same cached URL.
 */
function mediaWidth(tileW: number): number {
  const dpr =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
  const target = tileW * IMG_OVERSCALE * dpr
  if (target <= 400) return 400
  if (target <= 800) return 800
  return 1200
}

/**
 * Tile media — image wins over video (matching the schema rule). The element is
 * over-scaled and ref'd so the loop can apply the cursor-parallax transform.
 * When `observed`, videos don't autoplay (the canvas's IntersectionObserver
 * starts/stops them) and non-eager media defers loading: images carry data-src
 * until they approach the viewport; videos skip even metadata preload.
 */
function TileMedia({
  item,
  mediaRef,
  requestWidth = 1200,
  observed = false,
  eager = true,
}: {
  item: LayerItem
  mediaRef?: (el: HTMLElement | null) => void
  requestWidth?: number
  observed?: boolean
  eager?: boolean
}) {
  const common =
    'absolute inset-0 h-full w-full object-cover will-change-transform'
  if (item.image) {
    const src = urlForImage(item.image).width(requestWidth).auto('format').url()
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={mediaRef as (el: HTMLImageElement | null) => void}
        {...(eager || !observed ? {src} : {'data-src': src})}
        alt={item.image.alt ?? item.caption}
        draggable={false}
        className={common}
        style={{transform: `scale(${IMG_OVERSCALE})`}}
      />
    )
  }
  if (item.videoUrl) {
    return (
      <video
        ref={mediaRef as (el: HTMLVideoElement | null) => void}
        src={item.videoUrl}
        poster={item.poster ? urlForImage(item.poster).width(requestWidth).auto('format').url() : undefined}
        autoPlay={!observed}
        muted
        loop
        playsInline
        preload={eager || !observed ? 'metadata' : 'none'}
        aria-label={item.caption}
        className={common}
        style={{transform: `scale(${IMG_OVERSCALE})`}}
      />
    )
  }
  return null
}
