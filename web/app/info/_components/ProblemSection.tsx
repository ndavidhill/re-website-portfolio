import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {InfoTitleBody} from '@/lib/sanity'
import {PROBLEM_HEADING, PROBLEM_INTRO, PROBLEM_POINTS} from './info-content'

interface Props {
  heading?: string
  intro?: string
  points?: InfoTitleBody[]
}

/**
 * Deck slide 1 — the problem. Heading + intro, then up to three supporting
 * points (an optional large label like "$3T" over a short line). Content-first,
 * on-brand spacing; visual design comes in a later pass.
 */
export function ProblemSection({heading, intro, points}: Props) {
  const items =
    points && points.length > 0
      ? points.map((p) => ({label: p.label, body: p.body ?? ''}))
      : PROBLEM_POINTS

  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading || PROBLEM_HEADING}
          as="h2"
          className={`max-w-[900px] text-text-primary ${type.h1}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-[60px]">
        <Reveal>
          <p className={`max-w-[460px] text-text-secondary ${type.bodyLarge}`}>
            {intro || PROBLEM_INTRO}
          </p>
        </Reveal>

        <ul className="grid grid-cols-1 gap-x-[60px] gap-y-8 sm:grid-cols-3 md:grid-cols-1 md:gap-y-0">
          {items.map((p, i) => (
            <Reveal
              as="li"
              key={i}
              delay={0.06 + i * 0.06}
              className="border-t border-border pt-5"
            >
              {p.label && (
                <span className={`block text-text-primary ${type.h2Large}`}>
                  {p.label}
                </span>
              )}
              <p
                className={`max-w-[320px] text-text-secondary ${type.bodySmall} ${
                  p.label ? 'mt-3' : ''
                }`}
              >
                {p.body}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
