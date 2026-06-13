'use client'

import {useState} from 'react'
import Image from 'next/image'
import {Reveal} from '@/components/Reveal'
import {AnimatedHeading} from '@/components/AnimatedHeading'
import {type} from '@/lib/design'
import {urlForImage, type BrandPillar, type SanityImage} from '@/lib/sanity'

interface Props {
  heading: string
  intro?: string
  defaultImage?: SanityImage
  pillars: BrandPillar[]
  /** Deck slide 4 framing: a conviction lead-in above the pillars, and two
   *  closing bands (collaborators, connected experiences & codes) below. */
  conviction?: string
  collaborators?: string
  codes?: string
}

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

/**
 * Brand pillars — an indexed, hairline-divided list paired with a cross-fading
 * media panel. The five points read as one system (numbered 01–N, divided by
 * thin rules) rather than separate cards; all bodies stay visible so the viewer
 * can absorb every point at a glance.
 *
 * Hover / focus / tap a row to make it active: a left accent bar draws in, the
 * row indents, its index brightens and an arrow reveals, while the matching
 * image cross-fades (with a slow scale settle) into the panel. The active state
 * persists on leave — calmer and more deliberate than snapping back to a
 * default — and is mirrored by a small caption on the media.
 *
 * Each pillar supplies its own image; `defaultImage` is a per-pillar fallback.
 */
export function BrandPillars({
  heading,
  intro,
  defaultImage,
  pillars,
  conviction,
  collaborators,
  codes,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const bands = [collaborators, codes].filter(Boolean) as string[]

  const total = pillars.length
  const pad = (n: number) => String(n).padStart(2, '0')
  const active = pillars[activeIdx]

  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading}
          as="h2"
          className={`max-w-[800px] text-text-primary ${type.h1}`}
        />
        {conviction && (
          <Reveal delay={0.08}>
            <p className={`mt-6 max-w-[640px] text-text-secondary ${type.body}`}>
              {conviction}
            </p>
          </Reveal>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-[60px]">
        {/* Left — cross-fading media panel */}
        <Reveal className="md:order-first md:sticky md:top-[120px] md:self-start">
          <div className="relative aspect-square w-full overflow-hidden rounded-[4px] bg-surface md:rounded-[8px]">
            {pillars.map((p, i) => {
              const image = p.image ?? defaultImage
              if (!image) return null
              const isActive = i === activeIdx
              return (
                <div
                  key={p._key}
                  aria-hidden={!isActive}
                  className={`absolute inset-0 transition-opacity duration-700 ${EASE} ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={urlForImage(image).width(1400).auto('format').url()}
                    alt={image.alt ?? ''}
                    fill
                    sizes="(min-width: 768px) 45vw, 100vw"
                    className={`object-cover transition-transform duration-[1200ms] ${EASE} ${
                      isActive ? 'scale-100' : 'scale-[1.06]'
                    }`}
                    priority={i === 0}
                  />
                </div>
              )
            })}

            {/* Caption — ties the panel to the active row */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-4 md:p-5">
              <span className={`${type.caption} tabular-nums tracking-[0.4px] text-white/70`}>
                {pad(activeIdx + 1)} / {pad(total)}
              </span>
              <span className="text-right text-[15px] font-medium tracking-[-0.2px] text-white">
                {active?.title}
              </span>
            </div>
          </div>
        </Reveal>

        {/* Right — intro + interactive index list */}
        <div className="flex flex-col gap-8 md:gap-12">
          {intro && (
            <Reveal delay={0.08}>
              <p className={`max-w-[440px] text-text-secondary ${type.bodySmall}`}>
                {intro}
              </p>
            </Reveal>
          )}

          <Reveal delay={0.12}>
            <ul className="flex flex-col border-t border-border" role="list">
              {pillars.map((p, i) => {
                const isActive = i === activeIdx
                return (
                  <li key={p._key} className="border-b border-border">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onFocus={() => setActiveIdx(i)}
                      onClick={() => setActiveIdx(i)}
                      aria-pressed={isActive}
                      className="group relative block w-full py-5 text-left outline-none"
                    >
                      {/* Accent bar — draws in vertically when active */}
                      <span
                        aria-hidden
                        className={`absolute inset-y-2 left-0 w-[2px] origin-center rounded-full bg-text-primary transition-transform duration-300 ${EASE} ${
                          isActive ? 'scale-y-100' : 'scale-y-0'
                        }`}
                      />

                      <div
                        className={`flex items-baseline gap-4 pr-1 transition-[padding] duration-300 md:gap-5 ${EASE} ${
                          isActive ? 'pl-5' : 'pl-0'
                        }`}
                      >
                        <span
                          className={`${type.caption} shrink-0 tabular-nums tracking-[0.4px] transition-colors duration-300 ${
                            isActive ? 'text-text-primary' : 'text-text-faint'
                          }`}
                        >
                          {pad(i + 1)}
                        </span>

                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-[15px] font-medium leading-5 tracking-[-0.2px] text-text-primary md:text-base">
                              {p.title}
                            </h3>
                            <span
                              aria-hidden
                              className={`shrink-0 text-text-primary transition duration-300 ${EASE} ${
                                isActive
                                  ? 'translate-x-0 opacity-100'
                                  : '-translate-x-1 opacity-0'
                              }`}
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path
                                  d="M3.5 10.5 10.5 3.5M10.5 3.5H5M10.5 3.5V9"
                                  stroke="currentColor"
                                  strokeWidth="1.3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          </div>
                          <p
                            className={`${type.bodySmall} transition-colors duration-300 ${
                              isActive ? 'text-text-primary' : 'text-text-secondary'
                            }`}
                          >
                            {p.body}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        </div>
      </div>

      {/* Closing framework bands — collaborators + connected experiences & codes
          (deck slide 4). The 5 C's are held within these. */}
      {bands.length > 0 && (
        <div className="flex flex-col">
          {bands.map((b, i) => (
            <Reveal
              as="div"
              key={i}
              delay={0.06 + i * 0.06}
              className="border-t border-border py-5"
            >
              <p className={`max-w-[760px] text-text-secondary ${type.body}`}>{b}</p>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
