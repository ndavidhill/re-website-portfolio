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
 * Deck slide 3 — the brand system. A real sequence, so it's numbered — but it's
 * also a *cycle*, so a connector spine threads the phase nodes and a return cue
 * closes the loop back to Shape. That structure (not decoration) is what tells
 * the reader "each phase feeds the next, continuously."
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
        <Reveal delay={0.08}>
          <p className={`mt-6 max-w-[460px] text-text-secondary ${type.bodySmall}`}>
            {intro || SYSTEM_INTRO}
          </p>
        </Reveal>
      </div>

      {/* Connector spine sits behind the index nodes (left of the number gutter
          on desktop, hidden on mobile where rows stack). */}
      <ol className="relative border-t border-border">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[7px] top-0 bottom-[2.75rem] hidden w-px bg-border md:block"
        />
        {items.map((p, i) => (
          <Reveal
            as="li"
            key={i}
            delay={0.1 + i * 0.07}
            offset={14}
            className="relative grid grid-cols-1 gap-2 border-b border-border py-6 md:grid-cols-[3.25rem_minmax(0,200px)_1fr] md:items-baseline md:gap-8"
          >
            <span className="flex items-center gap-3 md:block">
              <span
                aria-hidden
                className="hidden h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-border bg-canvas md:flex"
              >
                <span className="h-[5px] w-[5px] rounded-full bg-text-primary" />
              </span>
              <span className={`tabular-nums text-text-faint md:hidden ${type.caption}`}>
                {pad(i + 1)}
              </span>
            </span>
            <h3 className="text-base font-medium leading-5 tracking-[-0.2px] text-text-primary md:text-lg">
              {p.title}
            </h3>
            <p className={`text-text-secondary ${type.bodySmall}`}>{p.body}</p>
          </Reveal>
        ))}

        {/* Return cue — the loop back to Shape. */}
        <Reveal as="li" delay={0.1} className="flex items-center gap-3 pt-5 md:pl-[3.25rem]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-text-faint">
            <path
              d="M4 12a8 8 0 1 0 2.3-5.6M4 4v3.2h3.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={`uppercase tracking-[0.4px] text-text-faint ${type.caption}`}>
            Continuous — Sustain feeds back into Shape
          </span>
        </Reveal>
      </ol>
    </section>
  )
}
