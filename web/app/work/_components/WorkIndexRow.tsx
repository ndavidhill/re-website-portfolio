import {Reveal} from '@/components/Reveal'
import {FlipOnResize} from '@/components/FlipOnResize'
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
            <span className={`${type.h2} text-text-secondary`}>{card.tagline}</span>
          )}
        </header>

        {media.length > 0 && (
          // Unified responsive strip: 2-up grid on mobile (first two items
          // only), daisy-chain flex on md+. Wrapped in FlipOnResize so the
          // shared items smoothly tween between the two layouts at the
          // breakpoint. Items 3+ are hidden on mobile via per-item classes.
          <FlipOnResize className="grid grid-cols-2 items-start gap-2.5 md:flex md:gap-2.5">
            {media.map((m, i) => (
              <WorkIndexMediaCard
                key={mediaKey(m, i)}
                media={m}
                href={href}
                alt={m.alt ?? `${card.client} — ${card.title}`}
                className={i >= 2 ? 'hidden md:block' : ''}
              />
            ))}
          </FlipOnResize>
        )}
      </article>
    </Reveal>
  )
}
