import Image from 'next/image'
import Link from 'next/link'
import {urlForImage, type CaseStudyCard} from '@/lib/sanity'

interface Props {
  card: CaseStudyCard
  /** Show the green "NEW" badge in the top-left corner. */
  showBadge?: boolean
  /** Override the pill label (defaults to client). */
  label?: string
}

/**
 * Matches Figma WorkCard (9:148): full-bleed image inside a 12px-rounded card,
 * a centred glassmorphism pill with the project label, and an optional "NEW"
 * badge top-left. Hover state lifts the image scale + increases pill opacity.
 */
export function WorkCard({card, showBadge = false, label}: Props) {
  const thumb = card.thumbnailImage
  const src = thumb
    ? urlForImage(thumb).width(1400).auto('format').url()
    : null
  const pillText = label ?? card.client

  return (
    <Link
      href={`/work/${card.slug}`}
      aria-label={`${card.client} — ${card.title}`}
      className="group relative block aspect-[678/782] w-full overflow-hidden rounded-[4px] bg-surface md:rounded-[12px]"
    >
      {src ? (
        <Image
          src={src}
          alt={thumb?.alt ?? `${card.client} — ${card.title}`}
          fill
          sizes="(min-width: 1280px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-text-faint">
          <span className="text-sm">No thumbnail</span>
        </div>
      )}

      {showBadge && (
        <span
          className="absolute left-6 top-6 inline-flex h-[30px] items-center rounded-[7.5px] bg-[#1fc16b] px-[15px] text-[22.5px] font-medium leading-[30px] text-white"
          aria-label="New project"
        >
          NEW
        </span>
      )}

      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex h-[46px] -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-white/40 px-2.5 text-[#333] backdrop-blur-md transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/70 group-hover:text-[#0a0a0a]"
      >
        <span className="text-[29.5px] font-medium leading-[33px] tracking-[-0.6px] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          {pillText}
        </span>
      </span>
    </Link>
  )
}
