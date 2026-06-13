import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {InfoTitleBody} from '@/lib/sanity'
import {PROBLEM_HEADING, PROBLEM_INTRO, PROBLEM_POINTS} from './info-content'
import {Eyebrow, Panel} from './InfoBits'

interface Props {
  heading?: string
  intro?: string
  points?: InfoTitleBody[]
}

/**
 * Deck slide 1 — the problem. On the site's 50/50 grid: eyebrow + heading left,
 * intro and evidence right. The points sit in surface panels; the $3T cost gets
 * an outsized figure so the cards still read as evidence, not a flat grid.
 */
export function ProblemSection({heading, intro, points}: Props) {
  const items =
    points && points.length > 0
      ? points.map((p) => ({label: p.label, body: p.body ?? ''}))
      : PROBLEM_POINTS

  return (
    <section className="grid grid-cols-1 gap-10 border-t border-border pt-5 md:grid-cols-2 md:gap-[60px]">
      <div className="flex flex-col gap-5">
        <Reveal>
          <Eyebrow>The problem</Eyebrow>
        </Reveal>
        <AnimatedHeading
          text={heading || PROBLEM_HEADING}
          as="h2"
          className={`text-text-primary ${type.h1}`}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Reveal delay={0.06}>
          <p className={`max-w-[460px] text-text-secondary ${type.bodyLarge}`}>
            {intro || PROBLEM_INTRO}
          </p>
        </Reveal>

        <ul className="flex flex-col gap-3">
          {items.map((p, i) => (
            <Reveal as="li" key={i} delay={0.1 + i * 0.07} offset={14}>
              <Panel>
                {p.label ? (
                  <>
                    <span className={`block text-text-primary ${type.display}`}>
                      {p.label}
                    </span>
                    <p className={`mt-3 text-text-faint ${type.bodySmall}`}>
                      {p.body}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-medium leading-6 tracking-[-0.3px] text-text-primary md:text-xl">
                    {p.body}
                  </p>
                )}
              </Panel>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
