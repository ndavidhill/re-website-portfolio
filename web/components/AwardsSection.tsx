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

      <Reveal delay={0.08}>
        <div className="border-t border-border pt-5">
          <div className="grid grid-cols-[2fr_1.5fr_2fr_0.75fr] gap-3 pb-4 text-base font-medium leading-6 tracking-[-0.4px] text-text-secondary md:gap-4 md:text-md">
            <div>Description</div>
            <div>Client</div>
            <div>Awards</div>
            <div className="text-right">Year</div>
          </div>
          <ul className="divide-y divide-border">
            {awards.map((a) => (
              <li
                key={a._key}
                className="grid grid-cols-[2fr_1.5fr_2fr_0.75fr] gap-3 py-3 text-sm leading-6 tracking-[-0.27px] text-text-primary md:gap-4 md:text-lg"
              >
                <span>{a.description}</span>
                <span className="text-text-secondary">{a.client}</span>
                <span className="text-text-secondary">{a.award}</span>
                <span className="justify-self-end text-right text-text-faint">{a.year}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
