'use client'

import {useEffect, useRef, useState} from 'react'
import {useInView} from '@/lib/useInView'
import {toEmbedUrl} from '@/lib/video'

interface Props {
  /** Vimeo/YouTube URL (rendered as a background embed). */
  url?: string
  /** Self-hosted file URL (takes precedence over `url`). */
  fileUrl?: string
  /** Poster shown until the video is in view + loaded (and as a fallback). */
  poster?: string
  title?: string
}

type VimeoPlayer = {
  on: (event: string, handler: () => void) => void
  destroy: () => Promise<unknown>
}

/**
 * Cover-filling background video (Vimeo/YouTube embed or MP4) that mounts once
 * it nears the viewport and then stays mounted — loading clips progressively
 * (not all at once) keeps mobile under its concurrent-video cap, which otherwise
 * leaves later clips blank. Must be placed inside a `relative` parent.
 *
 * The poster sits ON TOP of the iframe/video and is removed only when playback
 * has actually begun (Vimeo SDK `play` event for embeds, `playing` event for
 * MP4s). Hiding it earlier — e.g. on iframe `load` — crossfades the poster
 * through a still-blank embed and reads as a white flash on light backgrounds.
 */
export function LazyCoverVideo({url, fileUrl, poster, title}: Props) {
  const {ref, inView} = useInView<HTMLDivElement>()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const embed = url ? toEmbedUrl(url) : null
  const useIframe = Boolean(inView && !fileUrl && embed)
  const isVimeo = url ? url.includes('vimeo.com') : false
  const [posterHidden, setPosterHidden] = useState(false)

  // Attach the Vimeo SDK so we can listen for `play` — onLoad fires too early
  // (document parsed, but no frame painted yet).
  useEffect(() => {
    if (!useIframe || !isVimeo) return
    if (!iframeRef.current) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    import('@vimeo/player').then(({default: Player}) => {
      if (cancelled || !iframeRef.current) return
      const player = new Player(iframeRef.current) as unknown as VimeoPlayer
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
    }
  }, [useIframe, isVimeo])

  return (
    <div ref={ref} className="absolute inset-0">
      {inView && fileUrl && (
        <video
          src={fileUrl}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={title}
          onPlaying={() => setPosterHidden(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {useIframe && (
        <iframe
          ref={iframeRef}
          src={embed!}
          title={title ?? 'Video'}
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
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
    </div>
  )
}
