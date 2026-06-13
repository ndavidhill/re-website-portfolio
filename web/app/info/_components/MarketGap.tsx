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

/**
 * Deck slide 2 — the market gap. The three partial approaches (business /
 * identity / channel first) as columns, closing on the punchline that
 * positions RE as the one that connects the whole.
 */
export function MarketGap({heading, intro, types, punchline}: Props) {
  const cols =
    types && types.length > 0
      ? types.map((t) => ({title: t.title ?? '', body: t.body ?? ''}))
      : MARKET_TYPES

  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading || MARKET_HEADING}
          as="h2"
          className={`max-w-[900px] text-text-primary ${type.h1}`}
        />
      </div>

      <Reveal>
        <p className={`max-w-[640px] text-text-secondary ${type.body}`}>
          {intro || MARKET_INTRO}
        </p>
      </Reveal>

      <ul className="grid grid-cols-1 gap-x-[60px] gap-y-8 md:grid-cols-3">
        {cols.map((c, i) => (
          <Reveal
            as="li"
            key={i}
            delay={0.06 + i * 0.06}
            className="flex flex-col gap-3 border-t border-border pt-5"
          >
            <h3 className={`text-text-primary ${type.h2}`}>{c.title}</h3>
            <p className={`text-text-secondary ${type.bodySmall}`}>{c.body}</p>
          </Reveal>
        ))}
      </ul>

      <Reveal delay={0.1}>
        <p
          className={`max-w-[760px] text-text-primary [text-wrap:balance] ${type.h2Large}`}
        >
          {punchline || MARKET_PUNCHLINE}
        </p>
      </Reveal>
    </section>
  )
}
