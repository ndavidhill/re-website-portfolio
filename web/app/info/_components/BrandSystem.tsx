import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {InfoTitleBody} from '@/lib/sanity'
import {SYSTEM_HEADING, SYSTEM_INTRO, SYSTEM_PHASES} from './info-content'
import {Eyebrow, Panel} from './InfoBits'

interface Props {
  heading?: string
  intro?: string
  phases?: InfoTitleBody[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Deck slide 3 — the brand system. 50/50: eyebrow + heading + the "permanent
 * system" intro left; the phases right, in a surface panel. It's a real
 * sequence (numbered) but also a cycle — a connector spine threads the phase
 * nodes and a return cue closes the loop back to Shape, so the structure itself
 * says "each phase feeds the next, continuously".
 */
export function BrandSystem({heading, intro, phases}: Props) {
  const items =
    phases && phases.length > 0
      ? phases.map((p) => ({title: p.title ?? '', body: p.body ?? ''}))
      : SYSTEM_PHASES

  return (
    <section className="grid grid-cols-1 gap-10 border-t border-border pt-5 md:grid-cols-2 md:gap-[60px]">
      <div className="flex flex-col gap-5 md:sticky md:top-[120px] md:self-start">
        <Reveal>
          <Eyebrow>The system</Eyebrow>
        </Reveal>
        <AnimatedHeading
          text={heading || SYSTEM_HEADING}
          as="h2"
          className={`text-text-primary ${type.h1}`}
        />
        <Reveal delay={0.08}>
          <p className={`max-w-[420px] text-text-secondary ${type.bodyLarge}`}>
            {intro || SYSTEM_INTRO}
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.06}>
        <Panel>
          <ol className="relative">
            {/* Connector spine through the phase nodes. */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[6px] top-3 bottom-[3.25rem] w-px bg-border"
            />
            {items.map((p, i) => (
              <li
                key={i}
                className="relative grid grid-cols-[1.5rem_1fr] gap-4 border-b border-border py-5 first:pt-1"
              >
                <span className="relative flex justify-center pt-1.5">
                  <span
                    aria-hidden
                    className="flex h-[13px] w-[13px] items-center justify-center rounded-full border border-border bg-surface"
                  >
                    <span className="h-[5px] w-[5px] rounded-full bg-text-primary" />
                  </span>
                </span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2.5">
                    <span className={`tabular-nums text-text-faint ${type.caption}`}>
                      {pad(i + 1)}
                    </span>
                    <h3 className="text-base font-medium leading-5 tracking-[-0.2px] text-text-primary md:text-lg">
                      {p.title}
                    </h3>
                  </div>
                  <p className={`text-text-secondary ${type.bodySmall}`}>{p.body}</p>
                </div>
              </li>
            ))}

            {/* Return cue — the loop back to Shape. */}
            <li className="grid grid-cols-[1.5rem_1fr] gap-4 pt-5">
              <span className="flex justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-text-faint">
                  <path
                    d="M4 12a8 8 0 1 0 2.3-5.6M4 4v3.2h3.2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={`uppercase tracking-[0.4px] text-text-faint ${type.caption}`}>
                Continuous — Sustain feeds back into Shape
              </span>
            </li>
          </ol>
        </Panel>
      </Reveal>
    </section>
  )
}
