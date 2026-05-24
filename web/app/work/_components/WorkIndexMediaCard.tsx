import Image from 'next/image'
import Link from 'next/link'
import {
  urlForImage,
  type GridMediaItem,
  type SanityImageWithDimensions,
  type GridVideo,
} from '@/lib/sanity'

interface Props {
  media: GridMediaItem
  href: string
  alt: string
  /** Pill label shown on hover. Defaults to "View project". */
  pillText?: string
  /** Skip the flex sizing (used by the mobile 2-up grid). */
  noFlex?: boolean
}

/**
 * Single media card for the Work index — handles both images and short
 * looping videos. Each card keeps its own intrinsic aspect ratio so a row
 * of mixed media reads dynamically (cm.supply-style).
 *
 * Hover: the card's `flex-grow` increases from 1 → 2, widening it within
 * the row while siblings shrink to make room (daisychain-style). The
 * glassmorphic "View project" pill fades in.
 */
export function WorkIndexMediaCard({
  media,
  href,
  alt,
  pillText = 'View project',
  noFlex = false,
}: Props) {
  const ratioCss = computeAspectRatioCss(media)

  return (
    <Link
      href={href}
      aria-label={alt}
      className={
        'group relative block min-w-0 overflow-hidden rounded-[4px] bg-surface md:rounded-[12px] ' +
        (noFlex
          ? ''
          : 'flex-1 transition-[flex-grow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:[flex-grow:2]')
      }
      style={{aspectRatio: ratioCss}}
    >
      {isVideo(media) ? <VideoMedia media={media} alt={alt} /> : <ImageMedia media={media} alt={alt} />}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 flex h-[46px] -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-white/40 px-2.5 text-[#333] opacity-0 backdrop-blur-md transition-[background-color,opacity] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/70 group-hover:text-[#0a0a0a] group-hover:opacity-100"
      >
        <span className="text-[29.5px] font-medium leading-[33px] tracking-[-0.6px] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          {pillText}
        </span>
      </span>
    </Link>
  )
}

function ImageMedia({
  media,
  alt,
}: {
  media: SanityImageWithDimensions
  alt: string
}) {
  const src = urlForImage(media).width(1400).auto('format').url()
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
      className="object-cover"
    />
  )
}

function VideoMedia({media, alt}: {media: GridVideo; alt: string}) {
  const src = media.file?.asset?.url
  const posterSrc = media.poster
    ? urlForImage(media.poster).width(1400).auto('format').url()
    : undefined

  if (!src) {
    // Editor uploaded the schema item but didn't attach a file yet. Show the
    // poster as a fallback so the row layout is preserved.
    if (posterSrc) {
      return (
        <Image
          src={posterSrc}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      )
    }
    return null
  }

  return (
    <video
      src={src}
      poster={posterSrc}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}

function isVideo(media: GridMediaItem): media is GridVideo {
  return media._type === 'gridVideo'
}

/**
 * Returns a CSS `aspect-ratio` value derived from each media type:
 * - Images: `width / height` from Sanity asset metadata.
 * - Videos: the editor-supplied ratio string ("16/9", "9:16", "1.78").
 *   Falls back to 1/1 if invalid / missing.
 */
function computeAspectRatioCss(media: GridMediaItem): string {
  if (isVideo(media)) {
    return parseAspectString(media.aspectRatio) ?? '1 / 1'
  }
  const dims = media.asset.metadata?.dimensions
  return dims ? `${dims.width} / ${dims.height}` : '1 / 1'
}

function parseAspectString(value: string | undefined): string | null {
  if (!value) return null
  const cleaned = value.trim().replace(':', '/').replace(/\s+/g, '')
  if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(cleaned)) {
    const [w, h] = cleaned.split('/').map(Number)
    return w > 0 && h > 0 ? `${w} / ${h}` : null
  }
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) return cleaned
  return null
}
