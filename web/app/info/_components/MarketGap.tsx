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
 * Deck slide 2 — the market gap. Three partial approaches, each pulling its own
 * direction, resolved by a single full-width statement. The divergent arrows
 * and the unifying punchline carry the argument.
 */
export function MarketGap({heading, intro, types, punchline}: Props) {
  const cols =
    types && types.length > 0
      ? types.map((t) => ({title: t.title ?? '', body: t.body ?? ''}))
      : MARKET_TYPES

  return (
    <section className="flex flex-col gap-12 md:gap-20">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading || MARKET_HEADING}
          as="h2"
          className={`max-w-[900px] text-text-primary ${type.h1}`}
        />
        <Reveal delay={0.08}>
          <p className={`mt-6 max-w-[600px] text-text-secondary ${type.bodyLarge}`}>
            {intro || MARKET_INTRO}
          </p>
        </Reveal>
      </div>

      <ul className="grid grid-cols-1 gap-x-[60px] gap-y-10 md:grid-cols-3">
        {cols.map((c, i) => (
          <Reveal
            as="li"
            key={i}
            delay={0.06 + i * 0.08}
            offset={16}
            className="flex flex-col gap-3 border-t border-border pt-5"
          >
            <span aria-hidden className="text-text-faint">
              <svg
                width="22"
                height="22"
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
            <h3 className={`text-text-primary ${type.h2}`}>{c.title}</h3>
            <p className={`text-text-secondary ${type.bodySmall}`}>{c.body}</p>
          </Reveal>
        ))}
      </ul>

      <Reveal delay={0.1} className="border-t border-border pt-8">
        <p
          className={`max-w-[900px] text-text-primary [text-wrap:balance] ${type.h2Large}`}
        >
          {punchline || MARKET_PUNCHLINE}
        </p>
      </Reveal>
    </section>
  )
}
