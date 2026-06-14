'use client'

import {useEffect, useState} from 'react'
import {useReducedMotion} from 'framer-motion'
import {type} from '@/lib/design'
import {Panel} from './InfoBits'

interface Phase {
  title: string
  body: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const EASE = 'cubic-bezier(0.16,1,0.3,1)'
const R = 150
const C = 2 * Math.PI * R
const ADVANCE_MS = 3000

// Bullet positions around the ring (top → right → bottom → left = the
// clockwise Shape → System → Scale → Sustain order) as % of the square box,
// and the rotation that places the highlighted quarter-arc's start at each node.
const NODES = [
  {left: '50%', top: '15.9%', anchor: 'top'},
  {left: '84.1%', top: '50%', anchor: 'right'},
  {left: '50%', top: '84.1%', anchor: 'bottom'},
  {left: '15.9%', top: '50%', anchor: 'left'},
] as const
const ARC_ROTATION = [-90, 0, 90, 180]

/**
 * The brand system as a cyclical orbit (inspired by localremote's process loop,
 * grounded in the deck's "Brand System" ring). Four phase pills sit around a
 * ring with the hub at centre; a highlighted quarter-arc sweeps clockwise from
 * the active phase toward the next, so the loop reads as continuous — each phase
 * feeding the next. It auto-advances, and pauses so you can scrub by
 * hovering/focusing a phase; the active phase's detail shows beneath. Sized to
 * sit in the 50/50 right column.
 */
export function SystemCycle({phases}: {phases: Phase[]}) {
  const reduce = useReducedMotion()
  const n = Math.min(phases.length, 4)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduce || paused || n < 2) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % n), ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [reduce, paused, n])

  const activePhase = phases[active]

  return (
    <Panel className="flex flex-col gap-6">
      <div
        className="relative mx-auto aspect-square w-full max-w-[420px]"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <svg
          viewBox="0 0 440 440"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {/* Base ring */}
          <circle cx="220" cy="220" r={R} fill="none" stroke="var(--color-border)" strokeWidth="1" />
          {/* Highlighted quarter-arc — sweeps clockwise to the next phase */}
          <circle
            cx="220"
            cy="220"
            r={R}
            fill="none"
            stroke="var(--color-text-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${C / 4} ${C}`}
            style={{
              transformOrigin: 'center',
              transform: `rotate(${ARC_ROTATION[active] ?? 0}deg)`,
              transition: reduce ? 'none' : `transform 700ms ${EASE}`,
            }}
          />
        </svg>

        {/* Hub */}
        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <span className={`block uppercase tracking-[0.4px] text-text-faint ${type.caption}`}>
            Brand
          </span>
          <span className={`block uppercase tracking-[0.4px] text-text-faint ${type.caption}`}>
            system
          </span>
        </span>

        {/* Phase nodes */}
        {phases.slice(0, n).map((p, i) => {
          const node = NODES[i]
          const isActive = i === active
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-pressed={isActive}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-sm font-medium leading-none tracking-[-0.2px] outline-none transition-colors duration-300 ${EASE} focus-visible:ring-1 focus-visible:ring-border ${
                isActive
                  ? 'bg-text-primary text-canvas'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
              style={{left: node.left, top: node.top}}
            >
              <span className="tabular-nums opacity-50">{pad(i + 1)}</span>{' '}
              {p.title}
            </button>
          )
        })}
      </div>

      {/* Active phase detail */}
      <div className="border-t border-border pt-5">
        <div className="flex items-baseline gap-2.5">
          <span className={`tabular-nums text-text-faint ${type.caption}`}>
            {pad(active + 1)}
          </span>
          <h3 className="text-base font-medium leading-5 tracking-[-0.2px] text-text-primary md:text-lg">
            {activePhase?.title}
          </h3>
        </div>
        <p className={`mt-2 min-h-[44px] text-text-secondary ${type.bodySmall}`}>
          {activePhase?.body}
        </p>
      </div>
    </Panel>
  )
}
