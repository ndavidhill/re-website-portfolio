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
 * Deck slide 1 — the problem. The composition is deliberately asymmetric: one
 * outsized figure (the $3T cost) set against short qualitative statements, so it
 * reads as evidence of drift rather than a uniform stat grid. Monochrome,
 * hairline-divided, on the site's type scale.
 */
export function ProblemSection({heading, intro, points}: Props) {
  const items =
    points && points.length > 0
      ? points.map((p) => ({label: p.label, body: p.body ?? ''}))
      : PROBLEM_POINTS

  return (
    <section className="flex flex-col gap-12 md:gap-20">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading || PROBLEM_HEADING}
          as="h2"
          className={`max-w-[900px] text-text-primary ${type.h1}`}
        />
        <Reveal delay={0.08}>
          <p className={`mt-6 max-w-[560px] text-text-secondary ${type.bodyLarge}`}>
            {intro || PROBLEM_INTRO}
          </p>
        </Reveal>
      </div>

      <ul className="grid grid-cols-1 gap-x-[60px] gap-y-10 md:grid-cols-3">
        {items.map((p, i) => (
          <Reveal
            as="li"
            key={i}
            delay={0.06 + i * 0.08}
            offset={16}
            className="flex flex-col border-t border-border pt-5"
          >
            {p.label ? (
              <>
                <span className={`text-text-primary ${type.display}`}>{p.label}</span>
                <p className={`mt-4 max-w-[300px] text-text-faint ${type.bodySmall}`}>
                  {p.body}
                </p>
              </>
            ) : (
              <p className="max-w-[320px] text-[22px] font-medium leading-[26px] tracking-[-0.4px] text-text-primary md:text-2xl md:leading-7">
                {p.body}
              </p>
            )}
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
