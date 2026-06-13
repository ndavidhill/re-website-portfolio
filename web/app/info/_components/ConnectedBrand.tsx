'use client'

import {useState} from 'react'
import {motion, useReducedMotion} from 'framer-motion'
import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {animation, type} from '@/lib/design'
import type {InfoTitleBody} from '@/lib/sanity'
import {CONNECTED_HEADING, CONNECTED_LAYERS} from './info-content'

interface Props {
  heading?: string
  layers?: InfoTitleBody[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const CENTER = 180

/**
 * Deck slide 5 — the connected brand. The page's signature: the deck's
 * concentric model, rebuilt as a live diagram. Each layer is a ring building
 * outward from the core (Insights + strategy); the rings draw out on scroll and
 * the active layer lights its ring — hovering the list highlights the diagram
 * and vice-versa, reusing the site's media↔list hover language. Concentric
 * structure (not numbering) is what carries "every part connected".
 */
export function ConnectedBrand({heading, layers}: Props) {
  const reduce = useReducedMotion()
  const items =
    layers && layers.length > 0
      ? layers.map((l) => ({title: l.title ?? '', body: l.body}))
      : CONNECTED_LAYERS
  const [active, setActive] = useState(0)

  const n = items.length
  // Evenly spaced radii, core (index 0) innermost → outer.
  const radii = items.map((_, i) => Math.round((CENTER - 12) * ((i + 1) / n)))

  const ringVariants = {
    hidden: {scale: 0, opacity: 0},
    show: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {duration: 0.8, ease: animation.ease, delay: i * 0.07},
    }),
  }

  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading || CONNECTED_HEADING}
          as="h2"
          className={`max-w-[900px] text-text-primary ${type.h1}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-[60px]">
        {/* Diagram — concentric rings building outward from the core. */}
        <Reveal className="md:order-first md:sticky md:top-[120px] md:self-start">
          <div className="relative mx-auto w-full max-w-[460px]">
            <motion.svg
              viewBox="0 0 360 360"
              className="block w-full"
              initial={reduce ? 'show' : 'hidden'}
              whileInView="show"
              viewport={{once: true, margin: '0px 0px -80px 0px'}}
              role="img"
              aria-label="Concentric diagram of the brand system's connected layers"
            >
              {radii.map((r, i) => {
                const on = i === active
                return (
                  <motion.circle
                    key={i}
                    cx={CENTER}
                    cy={CENTER}
                    r={r}
                    fill="none"
                    custom={i}
                    variants={reduce ? undefined : ringVariants}
                    // Stroke is class-driven, not via framer's `style` — framer
                    // owns `style` for the scale animation and won't re-apply a
                    // static style prop on state change, so the highlight would
                    // stick to the wrong ring.
                    className={
                      '[transition:stroke_300ms_ease,stroke-width_300ms_ease] ' +
                      (on
                        ? '[stroke:var(--color-text-primary)] [stroke-width:2px]'
                        : '[stroke:var(--color-border)] [stroke-width:1px]')
                    }
                    style={{transformBox: 'fill-box', transformOrigin: 'center'}}
                  />
                )
              })}
              {/* Core marker + active index */}
              <circle cx={CENTER} cy={CENTER} r={3} fill="var(--color-text-primary)" />
              <text
                x={CENTER}
                y={CENTER - 14}
                textAnchor="middle"
                className="fill-text-faint"
                style={{
                  font: '500 11px var(--font-graphik, sans-serif)',
                  letterSpacing: '0.4px',
                }}
              >
                {pad(active + 1)} / {pad(n)}
              </text>
            </motion.svg>
          </div>
        </Reveal>

        {/* Layer list — hover/focus lights the matching ring. */}
        <Reveal delay={0.1}>
          <ul className="flex flex-col border-t border-border" role="list">
            {items.map((l, i) => {
              const on = i === active
              return (
                <li key={i} className="border-b border-border">
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-pressed={on}
                    className="group flex w-full items-baseline gap-5 py-4 text-left outline-none md:gap-6"
                  >
                    <span
                      className={`tabular-nums tracking-[0.4px] transition-colors duration-300 ${type.caption} ${
                        on ? 'text-text-primary' : 'text-text-faint'
                      }`}
                    >
                      {pad(i + 1)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <h3
                        className={`text-lg font-medium leading-6 tracking-[-0.3px] transition-colors duration-300 md:text-2xl ${
                          on ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {l.title}
                      </h3>
                      {l.body && (
                        <p className={`text-text-secondary ${type.bodySmall}`}>
                          {l.body}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
