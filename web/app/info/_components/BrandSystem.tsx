import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {InfoTitleBody} from '@/lib/sanity'
import {SYSTEM_HEADING, SYSTEM_INTRO, SYSTEM_PHASES} from './info-content'

interface Props {
  heading?: string
  intro?: string
  phases?: InfoTitleBody[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Deck slide 3 — the brand system. The four phases (Shape → System → Scale →
 * Sustain) as a numbered, hairline-divided list, matching the site's indexed
 * list language. Phases cascade in on scroll.
 */
export function BrandSystem({heading, intro, phases}: Props) {
  const items =
    phases && phases.length > 0
      ? phases.map((p) => ({title: p.title ?? '', body: p.body ?? ''}))
      : SYSTEM_PHASES

  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading || SYSTEM_HEADING}
          as="h2"
          className={`max-w-[800px] text-text-primary ${type.h1}`}
        />
        {(intro || SYSTEM_INTRO) && (
          <Reveal delay={0.08}>
            <p className={`mt-6 max-w-[460px] text-text-secondary ${type.bodySmall}`}>
              {intro || SYSTEM_INTRO}
            </p>
          </Reveal>
        )}
      </div>

      <ul className="flex flex-col border-t border-border">
        {items.map((p, i) => (
          <Reveal
            as="li"
            key={i}
            delay={0.1 + i * 0.06}
            offset={14}
            className="grid grid-cols-1 gap-2 border-b border-border py-6 md:grid-cols-[3rem_minmax(0,200px)_1fr] md:items-baseline md:gap-8"
          >
            <span className={`tabular-nums text-text-faint ${type.caption}`}>
              {pad(i + 1)}
            </span>
            <h3 className="text-base font-medium leading-5 tracking-[-0.2px] text-text-primary md:text-lg">
              {p.title}
            </h3>
            <p className={`text-text-secondary ${type.bodySmall}`}>{p.body}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
