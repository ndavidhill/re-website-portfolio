import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {InfoTitleBody} from '@/lib/sanity'
import {
  MARKET_HEADING,
  MARKET_INTRO,
  MARKET_PUNCHLINE,
  MARKET_TYPES,
} from './info-content'
import {Eyebrow, Panel} from './InfoBits'

interface Props {
  heading?: string
  intro?: string
  types?: InfoTitleBody[]
  punchline?: string
}

// Each partial approach pulls a different way — the arrow angle encodes the
// "every direction" idea (structure as information, not decoration).
const ANGLES = [-45, 135, 45, -135]

/**
 * Deck slide 2 — the market gap. 50/50: eyebrow + heading left, the three
 * partial approaches (surface panels, each arrow pulling a different way) right.
 * Resolves into a single inverted panel — the one bold, filled moment on the
 * page — that states RE's position.
 */
export function MarketGap({heading, intro, types, punchline}: Props) {
  const cols =
    types && types.length > 0
      ? types.map((t) => ({title: t.title ?? '', body: t.body ?? ''}))
      : MARKET_TYPES

  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      <div className="grid grid-cols-1 gap-10 border-t border-border pt-5 md:grid-cols-2 md:gap-[60px]">
        <div className="flex flex-col gap-5">
          <Reveal>
            <Eyebrow>The gap</Eyebrow>
          </Reveal>
          <AnimatedHeading
            text={heading || MARKET_HEADING}
            as="h2"
            className={`text-text-primary ${type.h1}`}
          />
        </div>

        <div className="flex flex-col gap-6">
          <Reveal delay={0.06}>
            <p className={`max-w-[460px] text-text-secondary ${type.bodyLarge}`}>
              {intro || MARKET_INTRO}
            </p>
          </Reveal>

          <ul className="flex flex-col gap-3">
            {cols.map((c, i) => (
              <Reveal as="li" key={i} delay={0.1 + i * 0.07} offset={14}>
                <Panel className="flex items-start gap-4">
                  <span aria-hidden className="mt-0.5 shrink-0 text-text-faint">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{transform: `rotate(${ANGLES[i % ANGLES.length]}deg)`}}
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-base font-medium leading-5 tracking-[-0.2px] text-text-primary md:text-lg">
                      {c.title}
                    </span>
                    <span className={`text-text-secondary ${type.bodySmall}`}>
                      {c.body}
                    </span>
                  </span>
                </Panel>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>

      <Reveal delay={0.08}>
        <div className="rounded-[12px] bg-text-primary px-6 py-10 md:px-10 md:py-14">
          <p className={`max-w-[900px] text-canvas [text-wrap:balance] ${type.h2Large}`}>
            {punchline || MARKET_PUNCHLINE}
          </p>
        </div>
      </Reveal>
    </section>
  )
}
