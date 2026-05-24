'use client'

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
 * Cover-filling background video (Vimeo/YouTube embed or MP4) that only mounts
 * while near the viewport, so mobile browsers' concurrent-video caps don't leave
 * later clips blank. Must be placed inside a `relative` (positioned) parent.
 */
export function LazyCoverVideo({url, fileUrl, poster, title}: Props) {
  const {ref, inView} = useInView<HTMLDivElement>('400px')
  const embed = url ? toEmbedUrl(url) : null

  return (
    <div ref={ref} className="absolute inset-0">
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
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
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  )
}
