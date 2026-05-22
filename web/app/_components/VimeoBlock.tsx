'use client'

import {useEffect, useRef, useState} from 'react'
import {MuteToggle} from '@/components/MuteToggle'

interface Props {
  url: string
  caption?: string
  audioControl?: boolean
  /** Override the aspect ratio (e.g. "16/9"). Otherwise auto-detected via SDK. */
  aspectRatio?: string
}

type VimeoPlayer = {
  setMuted: (m: boolean) => Promise<unknown>
  play: () => Promise<unknown>
  getMuted: () => Promise<boolean>
  getVideoWidth: () => Promise<number>
  getVideoHeight: () => Promise<number>
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
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const [muted, setMuted] = useState(true)
  const [aspect, setAspect] = useState<string>(
    normaliseAspect(aspectRatio) ?? INITIAL_ASPECT,
  )

  const embedUrl = toEmbedUrl(url)

  useEffect(() => {
    if (!iframeRef.current) return
    if (!isVimeoUrl(url)) return

    // Skip SDK entirely if the editor set an explicit aspect AND we don't need
    // it for audio control. Saves the import + handshake.
    const explicitAspect = normaliseAspect(aspectRatio)
    if (explicitAspect && !audioControl) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    import('@vimeo/player').then(({default: Player}) => {
      if (cancelled || !iframeRef.current) return
      const player = new Player(iframeRef.current) as unknown as VimeoPlayer
      playerRef.current = player

      // Auto-detect aspect when no override given. Vimeo resolves these once
      // metadata is parsed, so we await both then update once.
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

      cleanup = () => {
        player.destroy().catch(() => {})
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
      playerRef.current = null
    }
  }, [url, audioControl, aspectRatio])

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
        className="relative w-full overflow-hidden rounded-[15px] bg-canvas"
        style={{
          aspectRatio: aspect,
          // Force a compositing layer so iframe content clips against the
          // parent's border-radius (Chromium / WebKit don't do this by default).
          transform: 'translateZ(0)',
          isolation: 'isolate',
        }}
      >
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={caption ?? 'Video'}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 block h-full w-full"
        />
        {audioControl && (
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

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0]
      if (!id) return null
      const params = new URLSearchParams({
        autoplay: '1',
        muted: '1',
        loop: '1',
        controls: '0',
        title: '0',
        byline: '0',
        portrait: '0',
        background: '1',
        dnt: '1',
      })
      return `https://player.vimeo.com/video/${id}?${params.toString()}`
    }
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id =
        u.hostname === 'youtu.be'
          ? u.pathname.slice(1)
          : u.searchParams.get('v')
      if (!id) return null
      const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        loop: '1',
        playlist: id,
        controls: '0',
        modestbranding: '1',
        rel: '0',
        playsinline: '1',
      })
      return `https://www.youtube.com/embed/${id}?${params.toString()}`
    }
    return null
  } catch {
    return null
  }
}
