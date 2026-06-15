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
  /** Deck slide 4 framing. Conviction leads the list (01); collaborators and
   *  connected codes close it (07/08). All carry "Label — statement" copy. */
  conviction?: string
  collaborators?: string
  codes?: string
}

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]'
const pad = (n: number) => String(n).padStart(2, '0')

/** Split "Label — statement" framework copy into {title, body}. */
function splitBand(s: string, fallbackTitle: string): {title: string; body: string} {
  const parts = s.split(/\s+—\s+/)
  return parts.length > 1
    ? {title: parts[0], body: parts.slice(1).join(' — ')}
    : {title: fallbackTitle, body: s}
}

interface Row {
  key: string
  title: string
  body: string
  image?: SanityImage
}

/**
 * The framework as one indexed, hairline-divided list (01–08): Conviction leads,
 * the five C's sit within, Collaborators and Connected codes close it. The five
 * C's each carry an image that cross-fades into the sticky media panel on
 * hover/focus; the framing rows (Conviction / Collaborators / Codes) have no
 * image of their own, so they fall back to the default image. The active state
 * persists on leave and is mirrored by a caption on the media.
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

  const rows: Row[] = [
    ...(conviction ? [{key: 'conviction', ...splitBand(conviction, 'Conviction')}] : []),
    ...pillars.map((p) => ({key: p._key, title: p.title, body: p.body, image: p.image})),
    ...(collaborators
      ? [{key: 'collaborators', ...splitBand(collaborators, 'Collaborators')}]
      : []),
    ...(codes
      ? [{key: 'codes', ...splitBand(codes, 'Connected experiences & codes')}]
      : []),
  ]

  const total = rows.length
  const activeRow = rows[activeIdx]
  // Framing rows have no image — show the default image for those.
  const activeImageKey = activeRow?.image ? activeRow.key : 'default'

  // Image layers to cross-fade between: a fallback (for the framing rows that
  // have no image of their own) + each row that has one. Fallback prefers the
  // authored default image, else the first pillar image.
  const fallbackImage = defaultImage ?? pillars.find((p) => p.image)?.image
  const layers: Array<{key: string; image: SanityImage}> = []
  if (fallbackImage) layers.push({key: 'default', image: fallbackImage})
  rows.forEach((r) => {
    if (r.image) layers.push({key: r.key, image: r.image})
  })

  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text={heading}
          as="h2"
          className={`max-w-[800px] text-text-primary ${type.h1}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-[60px]">
        {/* Left — cross-fading media panel */}
        <Reveal className="md:order-first md:sticky md:top-[120px] md:self-start">
          <div className="relative aspect-square w-full overflow-hidden rounded-[4px] bg-surface md:rounded-[8px]">
            {layers.map((layer, i) => {
              const isActive = layer.key === activeImageKey
              return (
                <div
                  key={layer.key}
                  aria-hidden={!isActive}
                  className={`absolute inset-0 transition-opacity duration-700 ${EASE} ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={urlForImage(layer.image).width(1400).auto('format').url()}
                    alt={layer.image.alt ?? ''}
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
                {activeRow?.title}
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
              {rows.map((r, i) => {
                const isActive = i === activeIdx
                return (
                  <li key={r.key} className="border-b border-border">
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIdx(i)}
                      onFocus={() => setActiveIdx(i)}
                      onClick={() => setActiveIdx(i)}
                      aria-pressed={isActive}
                      className="group relative block w-full py-4 text-left outline-none md:py-[18px]"
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
                              {r.title}
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
                            {r.body}
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
    </section>
  )
}
