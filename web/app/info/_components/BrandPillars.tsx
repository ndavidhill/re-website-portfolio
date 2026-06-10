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
}

/**
 * Two-column section: image on the left, list of brand pillars on the right.
 * Hovering / focusing a pillar swaps its image into the left column with a
 * cross-fade; releasing returns to the default image. All images are stacked
 * absolutely and animated via opacity so the swap stays composited (no layout
 * thrash, GPU-only).
 *
 * Active pillar gets a filled surface + padding inset; inactive pillars sit in
 * subtle surface containers so the hover treatment stays clean.
 */
export function BrandPillars({heading, intro, defaultImage, pillars}: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const allImages: Array<{key: string; image: SanityImage}> = []
  if (defaultImage) allImages.push({key: 'default', image: defaultImage})
  pillars.forEach((p) =>
    allImages.push({key: p._key, image: p.image}),
  )

  const activeKey = activeIdx === null ? 'default' : pillars[activeIdx]._key

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
        {/* Left — image stack */}
        <Reveal className="md:order-first md:self-center">
          <div className="relative aspect-square w-full overflow-hidden rounded-[4px] bg-surface md:rounded-[8px]">
            {allImages.map(({key, image}) => (
              <div
                key={key}
                aria-hidden={key !== activeKey}
                className={
                  'absolute inset-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
                  (key === activeKey ? 'opacity-100' : 'opacity-0')
                }
              >
                <Image
                  src={urlForImage(image).width(1400).auto('format').url()}
                  alt={image.alt ?? ''}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority={key === 'default'}
                />
              </div>
            ))}
          </div>
        </Reveal>

        {/* Right — intro + pillar list */}
        <div className="flex flex-col gap-6 md:gap-[60px]">
          {intro && (
            <Reveal delay={0.08}>
              <p
                className={`max-w-[550px] text-text-secondary ${type.body}`}
              >
                {intro}
              </p>
            </Reveal>
          )}

          <ul className="flex flex-col gap-4" role="list">
            {pillars.map((p, i) => {
              const active = activeIdx === i
              return (
                <li key={p._key} className="overflow-hidden rounded-[4px] bg-surface">
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseLeave={() => setActiveIdx(null)}
                    onFocus={() => setActiveIdx(i)}
                    onBlur={() => setActiveIdx(null)}
                    aria-pressed={active}
                    className={`group flex w-full flex-col gap-3 rounded-[12px] px-4 py-4 pr-5 text-left transition-[background-color,color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      active
                        ? 'bg-text-primary pl-2 text-canvas shadow-[inset_0_0_0_1px_var(--color-border)]'
                        : 'bg-transparent hover:bg-text-primary hover:pl-2 hover:text-canvas hover:shadow-[inset_0_0_0_1px_var(--color-border)]'
                    }`}
                  >
                    <h3 className="translate-x-0 text-lg font-medium leading-6 tracking-[-0.4px] text-inherit transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 group-focus-visible:translate-x-2">
                      {p.title}
                    </h3>
                    <p className={`${type.bodySmall} translate-x-0 text-inherit opacity-75 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 group-focus-visible:translate-x-2`}>
                      {p.body}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
