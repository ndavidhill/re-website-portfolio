'use client'

import {useRef} from 'react'
import {useInView} from '@/lib/useInView'
import {proxyAsset} from '@/lib/assetProxy'
import {ProgressiveBlur} from './ProgressiveBlur'

interface Props {
  /** Self-hosted MP4 URL. */
  fileUrl: string
  /** Poster shown until the first frame paints. */
  poster?: string
  title?: string
}

/**
 * Cover-filling MP4 with the WebGL progressive blur drawn over it. The video is
 * served through the same-origin `/asset` proxy (see lib/assetProxy.ts) so its
 * frames can be sampled into a WebGL texture — cdn.sanity.io rejects the CORS
 * request a direct cross-origin <video> would need. Mounts lazily like
 * LazyCoverVideo to stay under the mobile concurrent-video cap.
 *
 * The video sits visible beneath the canvas: the blur canvas only covers it
 * once its texture is ready, so if WebGL is unavailable the plain video simply
 * shows through. Only for self-hosted files — third-party iframe embeds can't
 * be textured, so those keep using LazyCoverVideo with no blur.
 */
export function BlurredCoverVideo({fileUrl, poster, title}: Props) {
  const {ref, inView} = useInView<HTMLDivElement>()
  const videoRef = useRef<HTMLVideoElement>(null)

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
      {inView && (
        <video
          ref={videoRef}
          src={proxyAsset(fileUrl)}
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
      {inView && <ProgressiveBlur videoRef={videoRef} />}
    </div>
  )
}
