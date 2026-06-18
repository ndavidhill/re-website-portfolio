'use client'

import {useEffect, useState} from 'react'
import {useReducedMotion} from 'framer-motion'
import {type} from '@/lib/design'
import {Panel} from './InfoBits'
import {SystemMachineGraphic} from './SystemMachineGraphic'

interface Phase {
  title: string
  body: string
  detail?: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const ADVANCE_MS = 3000

// Hit-area positions over each phase cog, as % of the 498×486 illustration,
// in phase order: Shape, System, Scale, Sustain.
const COG_POS = [
  {left: '45%', top: '37.2%'},
  {left: '66.5%', top: '51.6%'},
  {left: '54.6%', top: '67.9%'},
  {left: '34.7%', top: '80.9%'},
] as const

/**
 * The brand system drawn as a pulley machine in the studio house. Each phase
 * maps to a pulley; the active one lifts, brightens and spins (see globals.css),
 * and the focus travels cog→cog as the phase auto-advances — so the machine
 * reads as alive. It pauses so you can scrub by hovering/focusing a cog; the
 * active phase's detail shows beneath. Sized to sit in the 50/50 right column.
 */
export function SystemCycle({phases}: {phases: Phase[]}) {
  const reduce = useReducedMotion()
  const n = Math.min(phases.length, 4)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  // Sticky "show details" mode: once the user expands a phase's detail, the
  // drawer stays open for every phase as the cycle continues — they've signalled
  // they want the deeper copy. Toggling collapse turns it back off.
  const [detailsOpen, setDetailsOpen] = useState(false)
  const expanded = detailsOpen

  useEffect(() => {
    if (reduce || paused || n < 2) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [reduce, paused, n])

  const activePhase = phases[active]
  const nextPhase = phases[(active + 1) % n]

  return (
    <Panel className="flex flex-col gap-6">
      <div
        className="relative mx-auto aspect-[498/486] w-full max-w-[460px]"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <SystemMachineGraphic
          active={active}
          className="absolute inset-0 h-full w-full"
        />
        {/* Transparent hit areas over each phase cog (interaction + a11y). */}
        {phases.slice(0, n).map((p, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            aria-label={`${pad(i + 1)} ${p.title}`}
            className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-text-primary/40"
            style={{left: COG_POS[i].left, top: COG_POS[i].top}}
          />
        ))}
      </div>

      {/* Active phase detail — contrast container (canvas card on the surface
          panel) with a pointer to the next phase and an expand toggle. */}
      <div className="rounded-[10px] bg-canvas p-5 md:p-6">
        <div className="flex items-baseline gap-2.5">
          <span className={`tabular-nums text-text-faint ${type.caption}`}>
            {pad(active + 1)}
          </span>
          <h3 className="text-base font-medium leading-5 tracking-[-0.2px] text-text-primary md:text-lg">
            {activePhase?.title}
          </h3>
        </div>
        <p className={`mt-3 text-text-secondary ${type.bodySmall}`}>{activePhase?.body}</p>

        {/* Expandable detail (grid-rows trick → smooth height; clamped to 5 lines). */}
        {activePhase?.detail && (
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <p className={`line-clamp-5 pt-3 text-text-secondary ${type.bodySmall}`}>
                {activePhase.detail}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-4">
          <span
            className={`uppercase tracking-[0.4px] text-text-faint ${type.caption}`}
            aria-hidden
          >
            → {nextPhase?.title}
          </span>
          {activePhase?.detail && (
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              aria-expanded={expanded}
              className={`inline-flex items-center gap-1.5 uppercase tracking-[0.4px] text-text-primary outline-none transition-colors hover:text-text-secondary focus-visible:text-text-secondary ${type.caption}`}
            >
              {expanded ? 'Collapse' : 'Expand for details'}
              <span aria-hidden className="text-[14px] leading-none">
                {expanded ? '−' : '+'}
              </span>
            </button>
          )}
        </div>
      </div>
    </Panel>
  )
}
