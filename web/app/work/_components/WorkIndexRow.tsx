import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {CaseStudyCard, GridMediaItem} from '@/lib/sanity'
import {WorkIndexMediaCard} from './WorkIndexMediaCard'

interface Props {
  card: CaseStudyCard
}

function mediaKey(media: GridMediaItem, index: number): string {
  if (media._type === 'gridVideo') return media._key ?? `v-${index}`
  return media._key ?? media.asset._id ?? `i-${index}`
}

/**
 * One row on the Work index — client + tagline header, then a flexible media
 * strip that lays out 1–4 images or videos. On `md+` cards share row width
 * equally and keep their intrinsic heights via aspect-ratio (cm.supply /
 * daisychain feel). On mobile the strip falls back to a 2-up grid. If
 * `gridImages` is empty, falls back to a single-item strip using
 * `thumbnailImage`.
 */
export function WorkIndexRow({card}: Props) {
  const media: GridMediaItem[] =
    card.gridImages && card.gridImages.length > 0
      ? card.gridImages
      : card.thumbnailImage
      ? [card.thumbnailImage]
      : []

  const href = `/work/${card.slug}`

  return (
    <Reveal>
      <article className="flex flex-col gap-6">
        <header className="flex flex-wrap items-baseline gap-x-3 pr-[15px]">
          <span className={`${type.h2} text-text-muted`}>{card.client}</span>
          {card.tagline && (
            <span className={`${type.h2} text-[#cccdcb]`}>{card.tagline}</span>
          )}
        </header>

        {media.length > 0 && (
          <>
            {/* Desktop (md+): cards share row width via flex-1 but keep their
                intrinsic heights via aspect-ratio. Top-aligned so portrait
                cards tower over landscape siblings. */}
            <div className="hidden gap-2.5 md:flex md:items-start">
              {media.map((m, i) => (
                <WorkIndexMediaCard
                  key={mediaKey(m, i)}
                  media={m}
                  href={href}
                  alt={m.alt ?? `${card.client} — ${card.title}`}
                />
              ))}
            </div>

            {/* Mobile (< md): show only the first two items in a 2-up grid.
                This block is itself md:hidden, so we slice rather than rely on
                per-item responsive classes (which couldn't re-reveal them on
                desktop). The desktop strip above renders the full set. */}
            <div className="grid grid-cols-2 gap-2.5 md:hidden">
              {media.slice(0, 2).map((m, i) => (
                <WorkIndexMediaCard
                  key={mediaKey(m, i)}
                  media={m}
                  href={href}
                  alt={m.alt ?? `${card.client} — ${card.title}`}
                  noFlex
                />
              ))}
            </div>
          </>
        )}
      </article>
    </Reveal>
  )
}
