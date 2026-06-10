import {AnimatedHeading} from '@/components/AnimatedHeading'
import {type} from '@/lib/design'
import type {CaseStudyCard} from '@/lib/sanity'
import {WorkIndexRow} from '@/app/work/_components/WorkIndexRow'

interface Props {
  cards: CaseStudyCard[]
}

/**
 * End-of-case-study teaser — shows the next case studies in the work-index
 * ordering using the same `WorkIndexRow` layout (daisy-chain media strip,
 * FlipOnResize breakpoint morph) as `/work`, so the navigational gesture and
 * hover treatment are unchanged. Falls silent when there's no more work.
 */
export function MoreWork({cards}: Props) {
  if (cards.length === 0) return null
  return (
    <section
      aria-label="More work"
      className="flex flex-col gap-12 md:gap-[80px]"
    >
      <header className="border-t border-border pt-5">
        <AnimatedHeading
          text="More work"
          as="h2"
          className={`${type.h1} text-text-primary`}
        />
      </header>

      <div className="flex flex-col gap-12 md:gap-[80px]">
        {cards.map((card) => (
          <WorkIndexRow key={card._id} card={card} />
        ))}
      </div>
    </section>
  )
}
