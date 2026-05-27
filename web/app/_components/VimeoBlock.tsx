'use client'

import {useEffect, useRef, useState} from 'react'
import {MuteToggle} from '@/components/MuteToggle'
import {toEmbedUrl} from '@/lib/video'
import {useInView} from '@/lib/useInView'

interface Props {
  url: string
  caption?: string
  audioControl?: boolean
  /** Override the aspect ratio (e.g. "16/9"). Otherwise auto-detected via SDK. */
  aspectRatio?: string
  /** Fallback image shown until the embed is in view + loaded. */
  poster?: string
}

type VimeoPlayer = {
  setMuted: (m: boolean) => Promise<unknown>
  play: () => Promise<unknown>
  getMuted: () => Promise<boolean>
  getVideoWidth: () => Promise<number>
  getVideoHeight: () => Promise<number>
  on: (event: string, handler: () => void) => void
  destroy: () => Promise<unknown>
}

const INITIAL_ASPECT = '16 / 9'

/**
 * Embeds a Vimeo (or YouTube fallback) video, filling its container width and
 * tracking the source's native aspect ratio so the video itself isn't
 * letterboxed inside the frame. Plays muted on autoplay, controls hidden.
 *
 * When `audioControl` is true, the Vimeo Player SDK drives a shared
 * `MuteToggle` overlay — the same component used on the homepage hero.
 */
export function VimeoBlock({
  url,
  caption,
  audioControl = false,
  aspectRatio,
  poster,
}: Props) {
  const {ref: containerRef, inView} = useInView<HTMLDivElement>()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const [muted, setMuted] = useState(true)
  const [aspect, setAspect] = useState<string>(
    normaliseAspect(aspectRatio) ?? INITIAL_ASPECT,
  )
  // Poster sits on top of the iframe and is removed only when the Vimeo SDK
  // reports playback has actually begun. `iframe.onLoad` is too early — it
  // fires once the embed's document has parsed, but the player still needs
  // hundreds of ms after that to paint its first frame. Hiding at onLoad
  // crossfades the poster out through a still-blank iframe, which on a white
  // canvas reads as a worse flash than no poster at all.
  const [posterHidden, setPosterHidden] = useState(false)

  const embedUrl = toEmbedUrl(url)

  useEffect(() => {
    if (!inView) return
    if (!iframeRef.current) return
    if (!isVimeoUrl(url)) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    import('@vimeo/player').then(({default: Player}) => {
      if (cancelled || !iframeRef.current) return
      const player = new Player(iframeRef.current) as unknown as VimeoPlayer
      playerRef.current = player

      // Auto-detect aspect when no override given. Vimeo resolves these once
      // metadata is parsed, so we await both then update once.
      const explicitAspect = normaliseAspect(aspectRatio)
      if (!explicitAspect) {
        Promise.all([player.getVideoWidth(), player.getVideoHeight()])
          .then(([w, h]) => {
            if (!cancelled && w > 0 && h > 0) setAspect(`${w} / ${h}`)
          })
          .catch(() => {})
      }

      if (audioControl) {
        player.getMuted().then((m) => {
          if (!cancelled) setMuted(m)
        })
      }

      // The first `play` event fires the moment the player has decoded and
      // begun rendering frames — clean crossfade target.
      player.on('play', () => {
        if (!cancelled) setPosterHidden(true)
      })

      cleanup = () => {
        player.destroy().catch(() => {})
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
      playerRef.current = null
    }
  }, [url, audioControl, aspectRatio, inView])

  const toggleMute = () => {
    const player = playerRef.current
    if (!player) return
    const next = !muted
    setMuted(next)
    player.setMuted(next).then(() => {
      if (!next) player.play().catch(() => {})
    })
  }

  if (!embedUrl) return null

  return (
    <figure className="w-full">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[4px] bg-canvas md:rounded-[16px]"
        style={{
          aspectRatio: aspect,
          // Force a compositing layer so iframe content clips against the
          // parent's border-radius (Chromium / WebKit don't do this by default).
          transform: 'translateZ(0)',
          isolation: 'isolate',
        }}
      >
        {/* Mount the embed once it nears the viewport (then it stays) — loading
            every clip up front trips mobile's concurrent-video cap and leaves
            later ones blank. Rendered before the poster so the poster (next
            sibling, same `absolute inset-0`) sits on top in stacking order. */}
        {inView && (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={caption ?? 'Video'}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 block h-full w-full"
          />
        )}
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            aria-hidden="true"
            className={
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ' +
              (posterHidden ? 'pointer-events-none opacity-0' : 'opacity-100')
            }
          />
        )}
        {audioControl && inView && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-4">
            <MuteToggle muted={muted} onToggle={toggleMute} size="sm" />
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm leading-[22px] text-text-secondary">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

function isVimeoUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('vimeo.com')
  } catch {
    return false
  }
}

/** Accepts "16/9", "16 / 9", "16:9", or a free decimal "1.78". Returns CSS form. */
function normaliseAspect(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Allow colon as a separator (designer-friendly).
  const slashed = trimmed.replace(':', '/').replace(/\s+/g, '')
  // Validate either "X/Y" with positive numbers, or a positive decimal.
  if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(slashed)) {
    const [w, h] = slashed.split('/').map(Number)
    return w > 0 && h > 0 ? `${w} / ${h}` : null
  }
  if (/^\d+(?:\.\d+)?$/.test(slashed)) {
    return slashed
  }
  return null
}

