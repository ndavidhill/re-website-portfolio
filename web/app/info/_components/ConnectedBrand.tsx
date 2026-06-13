import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {InfoTitleBody} from '@/lib/sanity'
import {CONNECTED_HEADING, CONNECTED_LAYERS} from './info-content'

interface Props {
  heading?: string
  layers?: InfoTitleBody[]
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Deck slide 5 — the connected brand. The layers of the system (insights →
 * environmental experiences) as a numbered, hairline-divided list that builds
 * on scroll. Optional per-layer body shows when authored.
 */
export function ConnectedBrand({heading, layers}: Props) {
  const items =
    layers && layers.length > 0
      ? layers.map((l) => ({title: l.title ?? '', body: l.body}))
      : CONNECTED_LAYERS

  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading || CONNECTED_HEADING}
          as="h2"
          className={`max-w-[900px] text-text-primary ${type.h1}`}
        />
      </div>

      <ul className="flex flex-col border-t border-border">
        {items.map((l, i) => (
          <Reveal
            as="li"
            key={i}
            delay={0.06 + (i % 7) * 0.05}
            offset={12}
            rootMarginPx={20}
            className="flex items-baseline gap-5 border-b border-border py-5 md:gap-8"
          >
            <span className={`tabular-nums text-text-faint ${type.caption}`}>
              {pad(i + 1)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h3 className="text-lg font-medium leading-6 tracking-[-0.3px] text-text-primary md:text-2xl">
                {l.title}
              </h3>
              {l.body && (
                <p className={`text-text-secondary ${type.bodySmall}`}>{l.body}</p>
              )}
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
