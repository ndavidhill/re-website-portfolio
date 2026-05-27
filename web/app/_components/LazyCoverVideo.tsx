'use client'

import {useState} from 'react'
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

/**
 * Cover-filling background video (Vimeo/YouTube embed or MP4) that mounts once
 * it nears the viewport and then stays mounted — loading clips progressively
 * (not all at once) keeps mobile under its concurrent-video cap, which otherwise
 * leaves later clips blank. Must be placed inside a `relative` parent.
 *
 * The poster is rendered ON TOP of the iframe/video and fades out only after
 * the embed signals load + a short grace period for the first frame to paint —
 * without this, the iframe's own (white) loading frame briefly covers the
 * poster on light backgrounds.
 */
export function LazyCoverVideo({url, fileUrl, poster, title}: Props) {
  const {ref, inView} = useInView<HTMLDivElement>()
  const embed = url ? toEmbedUrl(url) : null
  const [posterHidden, setPosterHidden] = useState(false)

  // `load` for iframes fires once the embed's document is parsed; the player
  // typically takes another beat to paint its first frame. The delay covers
  // that gap so we don't reveal a blank iframe.
  const hidePosterSoon = () => {
    setTimeout(() => setPosterHidden(true), 250)
  }

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
          onPlaying={hidePosterSoon}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {inView && !fileUrl && embed && (
        <iframe
          src={embed}
          title={title ?? 'Video'}
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={hidePosterSoon}
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
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ' +
            (posterHidden ? 'pointer-events-none opacity-0' : 'opacity-100')
          }
        />
      )}
    </div>
  )
}
