import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {HomeAward} from '@/lib/sanity'

interface Props {
  heading?: string
  awards: HomeAward[] | undefined
}

/**
 * Recognition / awards table — four columns (description, client, award, year),
 * rendered as a divided list under an animated heading. Falls silent when the
 * awards array is empty. Lives on both the homepage and the info page; the
 * info page passes in the same data (homePage.awards) so the section reads
 * identically on both surfaces.
 */
export function AwardsSection({heading, awards}: Props) {
  if (!awards || awards.length === 0) return null
  return (
    <section className="flex flex-col gap-12">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading ?? '14 years of global recognition.'}
          as="h2"
          className={`max-w-[700px] text-text-primary ${type.h1}`}
        />
      </div>

      {/* Build effect: the column header leads, then rows cascade in on their
          own viewport triggers so the table assembles as it scrolls into view.
          Each row is its own Reveal (as="li" keeps the divide-y rule on the
          animated element, so the hairline arrives with its row). The modulo
          stagger cascades whichever batch of rows enters together while rows
          reached later by scrolling still appear near-instantly.

          Semantics: a ul styled as a table loses column↔header association
          for screen readers, so the structure carries ARIA table roles
          (table → row/columnheader, rowgroup → row/cell).

          Layout: 4-column grid on md+; on mobile those columns would crush
          to ~100px each and rows ran ~190px tall, so rows restack instead —
          description + year on the first line, client and award full-width
          beneath (same four cells, rearranged via order + col-span). */}
      <div
        role="table"
        aria-label={heading ?? 'Awards and recognition'}
        className="border-t border-border pt-5"
      >
        <Reveal
          role="row"
          delay={0.08}
          offset={14}
          duration={0.5}
          className="hidden pb-4 text-xs font-medium uppercase leading-4 tracking-[0.5px] text-text-faint md:grid md:grid-cols-[2fr_1.5fr_2fr_0.75fr] md:gap-4"
        >
          <div role="columnheader">Description</div>
          <div role="columnheader">Client</div>
          <div role="columnheader">Awards</div>
          <div role="columnheader" className="text-right">
            Year
          </div>
        </Reveal>
        <ul role="rowgroup" className="divide-y divide-border">
          {awards.map((a, i) => (
            <Reveal
              as="li"
              role="row"
              // _key alone collides for a couple of seeded rows (e.g. the two
              // Optus entries) — suffix the index so React never drops a row.
              // Safe: the list is static, never reordered client-side.
              key={`${a._key}-${i}`}
              delay={0.14 + (i % 6) * 0.05}
              offset={12}
              duration={0.5}
              rootMarginPx={20}
              className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3 text-sm leading-6 tracking-[-0.27px] text-text-primary md:grid-cols-[2fr_1.5fr_2fr_0.75fr] md:gap-4 md:text-lg"
            >
              <span role="cell" className="order-1 md:order-none">
                {a.description}
              </span>
              <span
                role="cell"
                className="order-3 col-span-2 text-text-secondary md:order-none md:col-span-1"
              >
                {a.client}
              </span>
              <span
                role="cell"
                className="order-4 col-span-2 text-text-secondary md:order-none md:col-span-1"
              >
                {a.award}
              </span>
              <span
                role="cell"
                className="order-2 justify-self-end text-right text-text-faint md:order-none"
              >
                {a.year}
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
