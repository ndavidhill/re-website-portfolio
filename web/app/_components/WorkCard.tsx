import Image from 'next/image'
import Link from 'next/link'
import {urlForImage, type CaseStudyCard} from '@/lib/sanity'
import {ui} from '@/lib/design'

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
      className="group relative block aspect-[200/250] w-full overflow-hidden rounded-[4px] bg-surface md:rounded-[12px]"
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
          className={`${ui.badge.new} absolute left-3 top-3 md:left-4 md:top-4`}
          aria-label="New project"
        >
          NEW
        </span>
      )}

      <span
        aria-hidden="true"
        className={`${ui.pill.glassOverlay} transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}
      >
        <span className="min-w-0 truncate">{pillText}</span>
      </span>
    </Link>
  )
}
