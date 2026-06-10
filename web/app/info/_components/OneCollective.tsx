import Image from 'next/image'
import {AnimatedHeading} from '@/components/AnimatedHeading'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import {urlForImage, type SanityImage} from '@/lib/sanity'

interface Props {
  heading?: string
  subheading?: string
  intro?: string
  team: SanityImage[] | undefined
}

/**
 * "One collective" — the team section. Top-line h1 spans the full width;
 * below it a 2-column grid leaves the left column intentionally empty (so
 * the subheading, intro paragraph, and 3-column headshot grid sit on the
 * right, matching the Figma's negative-space rhythm).
 *
 * On mobile the empty left column collapses and the right-column stack
 * (subheading → intro → headshot grid) reflows full-width.
 */
export function OneCollective({heading, subheading, intro, team}: Props) {
  return (
    <section className="flex flex-col gap-10 md:gap-[60px]">
      {/* Header row — one shared border line above; heading on the left,
          subheading + intro on the right, both top-aligning via the grid.
          Same pattern the homepage TLDR / Q&A sections use. */}
      <div className="border-t border-border pt-5">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-[60px]">
          <AnimatedHeading
            text={heading ?? 'One collective'}
            as="h2"
            className={`text-text-primary ${type.h1}`}
          />

          {(subheading || intro) && (
            <Reveal>
              <div className="flex flex-col gap-6">
                {subheading && (
                  <h3 className="text-base font-medium leading-[18px] tracking-[-0.176px] text-text-primary">
                    {subheading}
                  </h3>
                )}
                {intro && (
                  <p
                    className={`max-w-[550px] text-text-secondary ${type.body}`}
                  >
                    {intro}
                  </p>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </div>

      {/* Headshot grid — sits in the right column only (left stays empty on
          md+ to keep the negative-space rhythm from the Figma). */}
      {team && team.length > 0 && (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-[60px]">
          <div aria-hidden className="hidden md:block" />

          <Reveal delay={0.08}>
            <ul role="list" className="grid grid-cols-3 gap-2 md:gap-3">
              {team.map((person, i) => (
                <li
                  key={(person as {_key?: string})._key ?? i}
                  className="relative aspect-square overflow-hidden rounded-[4px] bg-surface md:rounded-[12px]"
                >
                  <Image
                    src={urlForImage(person).width(600).auto('format').url()}
                    alt={person.alt ?? ''}
                    fill
                    sizes="(min-width: 768px) 16vw, 33vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      )}
    </section>
  )
}
