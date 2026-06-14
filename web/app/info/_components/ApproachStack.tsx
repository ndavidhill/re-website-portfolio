'use client'

import {useEffect, useRef, useState, type ReactNode} from 'react'
import {Reveal} from '@/components/Reveal'
import {type} from '@/lib/design'
import type {InfoTitleBody} from '@/lib/sanity'
import {Eyebrow, Panel} from './InfoBits'
import {
  MARKET_HEADING,
  MARKET_INTRO,
  MARKET_PUNCHLINE,
  MARKET_TYPES,
  PROBLEM_HEADING,
  PROBLEM_INTRO,
  PROBLEM_POINTS,
  SYSTEM_HEADING,
  SYSTEM_INTRO,
  SYSTEM_PHASES,
} from './info-content'

interface SectionInput {
  heading?: string
  intro?: string
}
interface Props {
  problem: SectionInput & {points?: InfoTitleBody[]}
  market: SectionInput & {types?: InfoTitleBody[]; punchline?: string}
  system: SectionInput & {phases?: InfoTitleBody[]}
}

const pad = (n: number) => String(n).padStart(2, '0')
const ARROW_ANGLES = [-45, 135, 45, -135]

/**
 * The deck's argument — problem → gap → system — as one scroll-synced unit.
 *
 * Desktop: a sticky left rail accumulates the three label+title pairs, threaded
 * by a connector spine, while the evidence scrolls on the right. An
 * IntersectionObserver tracks which block is centred; the rail emphasises the
 * active title and dims the rest, so the spine "writes itself" and you read the
 * argument as a connected stack. Mobile: the rail collapses — each label+title
 * sits inline above its content.
 */
export function ApproachStack({problem, market, system}: Props) {
  const items: Array<{eyebrow: string; title: string; render: () => ReactNode}> = [
    {
      eyebrow: 'The problem',
      title: problem.heading || PROBLEM_HEADING,
      render: () => <ProblemContent intro={problem.intro} points={problem.points} />,
    },
    {
      eyebrow: 'The gap',
      title: market.heading || MARKET_HEADING,
      render: () => (
        <MarketContent
          intro={market.intro}
          types={market.types}
          punchline={market.punchline}
        />
      ),
    },
    {
      eyebrow: 'The system',
      title: system.heading || SYSTEM_HEADING,
      render: () => <SystemContent intro={system.intro} phases={system.phases} />,
    },
  ]

  const [active, setActive] = useState(0)
  const blockRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const els = blockRefs.current.filter(Boolean) as HTMLDivElement[]
    if (els.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        // The block crossing the upper-centre band is active.
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) {
          const idx = els.indexOf(hit.target as HTMLDivElement)
          if (idx !== -1) setActive(idx)
        }
      },
      {rootMargin: '-18% 0px -62% 0px', threshold: 0},
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section className="border-t border-border pt-5">
      {/* No items-start: the left cell must stretch to the content column's
          height so the sticky rail can travel the whole scroll (otherwise its
          containing block is only as tall as the rail and it scrolls away). */}
      <div className="md:grid md:grid-cols-2 md:gap-[60px]">
        {/* Left rail — sticky, accumulating. Desktop only. */}
        <div className="hidden md:block">
          <div className="sticky top-[110px]">
            <ol className="relative flex flex-col gap-7">
              {/* Spine centred on the bullet column (1.5rem wide → centre at
                  12px); sits behind the dots, which carry an opaque fill so the
                  line doesn't cut through them. */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-[11.5px] top-3 bottom-3 w-px bg-border"
              />
              {items.map((it, i) => {
                const isActive = i === active
                const isPast = i < active
                return (
                  <li key={i} className="grid grid-cols-[1.5rem_1fr] gap-4">
                    <span className="flex justify-center pt-1.5">
                      <span
                        aria-hidden
                        className={`relative h-[13px] w-[13px] rounded-full border transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                          isActive
                            ? 'border-text-primary bg-text-primary'
                            : isPast
                            ? 'border-text-secondary bg-canvas'
                            : 'border-border bg-canvas'
                        }`}
                      />
                    </span>
                    <div
                      className={`flex flex-col gap-2.5 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                        isActive ? 'opacity-100' : isPast ? 'opacity-70' : 'opacity-40'
                      }`}
                    >
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium uppercase leading-4 tracking-[0.4px] transition-colors duration-500 ${
                          isActive
                            ? 'bg-surface text-text-secondary'
                            : 'bg-transparent text-text-faint'
                        }`}
                      >
                        {it.eyebrow}
                      </span>
                      <p
                        className={`max-w-[440px] font-medium tracking-[-0.6px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                          isActive
                            ? 'text-[30px] leading-[32px] text-text-primary'
                            : 'text-xl leading-6 text-text-primary'
                        }`}
                      >
                        {it.title}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        {/* Right — the evidence blocks. */}
        <div className="flex flex-col gap-24 md:gap-[160px]">
          {items.map((it, i) => (
            <div
              key={i}
              ref={(el) => {
                blockRefs.current[i] = el
              }}
            >
              {/* Inline label + title — mobile only (rail is hidden there). */}
              <div className="mb-8 flex flex-col gap-4 md:hidden">
                <Eyebrow>{it.eyebrow}</Eyebrow>
                <h2 className={`max-w-[440px] text-text-primary ${type.h1}`}>
                  {it.title}
                </h2>
              </div>
              {it.render()}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Content blocks (right column) ──────────────────────────────────────────

function ProblemContent({intro, points}: {intro?: string; points?: InfoTitleBody[]}) {
  const items =
    points && points.length > 0
      ? points.map((p) => ({label: p.label, body: p.body ?? ''}))
      : PROBLEM_POINTS
  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <p className={`max-w-[460px] text-text-secondary ${type.bodyLarge}`}>
          {intro || PROBLEM_INTRO}
        </p>
      </Reveal>
      <ul className="flex flex-col gap-3">
        {items.map((p, i) => (
          <Reveal as="li" key={i} delay={0.08 + i * 0.07} offset={14}>
            <Panel>
              {p.label ? (
                <>
                  <span className={`block text-text-primary ${type.display}`}>
                    {p.label}
                  </span>
                  <p className={`mt-3 text-text-faint ${type.bodySmall}`}>{p.body}</p>
                </>
              ) : (
                <p className="text-lg font-medium leading-6 tracking-[-0.3px] text-text-primary md:text-xl">
                  {p.body}
                </p>
              )}
            </Panel>
          </Reveal>
        ))}
      </ul>
    </div>
  )
}

function MarketContent({
  intro,
  types,
  punchline,
}: {
  intro?: string
  types?: InfoTitleBody[]
  punchline?: string
}) {
  const cols =
    types && types.length > 0
      ? types.map((t) => ({title: t.title ?? '', body: t.body ?? ''}))
      : MARKET_TYPES
  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <p className={`max-w-[460px] text-text-secondary ${type.bodyLarge}`}>
          {intro || MARKET_INTRO}
        </p>
      </Reveal>
      <ul className="flex flex-col gap-3">
        {cols.map((c, i) => (
          <Reveal as="li" key={i} delay={0.08 + i * 0.07} offset={14}>
            <Panel className="flex items-start gap-4">
              <span aria-hidden className="mt-0.5 shrink-0 text-text-faint">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{transform: `rotate(${ARROW_ANGLES[i % ARROW_ANGLES.length]}deg)`}}
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
                <span className={`text-text-secondary ${type.bodySmall}`}>{c.body}</span>
              </span>
            </Panel>
          </Reveal>
        ))}
      </ul>
      <Reveal delay={0.08}>
        <div className="rounded-[12px] bg-text-primary px-6 py-10 md:px-8 md:py-12">
          <p className={`max-w-[520px] text-canvas [text-wrap:balance] ${type.h2Large}`}>
            {punchline || MARKET_PUNCHLINE}
          </p>
        </div>
      </Reveal>
    </div>
  )
}

function SystemContent({intro, phases}: {intro?: string; phases?: InfoTitleBody[]}) {
  const items =
    phases && phases.length > 0
      ? phases.map((p) => ({title: p.title ?? '', body: p.body ?? ''}))
      : SYSTEM_PHASES
  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <p className={`max-w-[460px] text-text-secondary ${type.bodyLarge}`}>
          {intro || SYSTEM_INTRO}
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <Panel>
          <ol className="relative">
            {/* Spine centred on the bullet column (centre at 12px), running
                from the first node to the return cue. */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-[11.5px] top-3 bottom-[3.25rem] w-px bg-border"
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
    </div>
  )
}
