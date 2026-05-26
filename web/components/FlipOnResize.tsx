'use client'

import {type ReactNode, useEffect, useRef} from 'react'
import {gsap} from 'gsap'
import {Flip} from 'gsap/Flip'
import {useReducedMotion} from 'framer-motion'

// Plugin registration is idempotent — safe in the client bundle.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Flip)
}

// Stable default — kept at module scope so the effect doesn't re-run on every
// render of a parent that doesn't pass `breakpoints`.
const DEFAULT_BREAKPOINTS = ['(min-width: 768px)']

interface Props {
  className?: string
  /** Animation duration in seconds. */
  duration?: number
  /**
   * Media-query strings that signal a real layout change. FLIP only animates
   * when one of these crosses — within a breakpoint, browser resize is left to
   * normal CSS reflow (so it stays smooth), and incidental container size
   * changes (e.g. a card's height growing on hover) never trip the animation.
   */
  breakpoints?: string[]
  children: ReactNode
}

/**
 * Wraps a responsive container and smoothly tweens its **direct children**
 * between layouts at breakpoint crossings using GSAP's Flip plugin. Respects
 * `prefers-reduced-motion`.
 *
 * Earlier versions used a `ResizeObserver`, but that also fires on any size
 * change of the container — including the row-height growing when a card
 * expands on hover. That conflicted with the daisy-chain hover transition.
 * Tying triggers to `matchMedia` gives a clean signal for real layout changes.
 */
export function FlipOnResize({
  className,
  duration = 0.55,
  breakpoints = DEFAULT_BREAKPOINTS,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const root = ref.current
    if (!root) return

    const targets = () => Array.from(root.children) as HTMLElement[]
    // `state` holds the layout we'll tween FROM. Captured at mount, refreshed
    // after every animation. Within a breakpoint we leave it alone — the
    // animation is only meaningful between breakpoints, so a slightly-stale
    // "before" snapshot still produces a coherent tween to the new layout.
    let state = Flip.getState(targets())

    const mqs = breakpoints.map((q) => window.matchMedia(q))

    const onChange = () => {
      Flip.from(state, {
        duration,
        ease: 'power2.inOut',
        absolute: true,
        nested: true,
        onComplete: () => {
          state = Flip.getState(targets())
        },
      })
    }

    mqs.forEach((m) => m.addEventListener('change', onChange))
    return () => mqs.forEach((m) => m.removeEventListener('change', onChange))
  }, [reduce, duration, breakpoints])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
