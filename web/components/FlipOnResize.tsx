'use client'

import {type ReactNode, useEffect, useRef} from 'react'
import {gsap} from 'gsap'
import {Flip} from 'gsap/Flip'
import {useReducedMotion} from 'framer-motion'

// Plugin registration is idempotent — safe in the client bundle.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Flip)
}

interface Props {
  className?: string
  /** Animation duration in seconds. */
  duration?: number
  /** ms to wait after the last resize event before animating. */
  settleMs?: number
  children: ReactNode
}

/**
 * Wraps a responsive container and smoothly tweens its **direct children**
 * between layouts whenever its size changes — e.g. when a breakpoint flips a
 * grid into a flex strip, when the window resizes, or on orientation change.
 *
 * Uses GSAP's FLIP plugin: capture the children's positions, let the new
 * layout settle, then animate from the old positions to the new. Respects
 * `prefers-reduced-motion`.
 */
export function FlipOnResize({
  className,
  duration = 0.55,
  settleMs = 120,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const root = ref.current
    if (!root) return

    const targets = () => Array.from(root.children) as HTMLElement[]
    let state = Flip.getState(targets())
    let timeout: number | undefined
    // ResizeObserver fires once immediately after observe — skip that initial
    // delivery so we don't animate on mount.
    let isFirst = true

    const ro = new ResizeObserver(() => {
      if (isFirst) {
        isFirst = false
        return
      }
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => {
        Flip.from(state, {
          duration,
          ease: 'power2.inOut',
          absolute: false,
          nested: true,
          onComplete: () => {
            state = Flip.getState(targets())
          },
        })
      }, settleMs)
    })
    ro.observe(root)

    return () => {
      ro.disconnect()
      if (timeout) window.clearTimeout(timeout)
    }
  }, [reduce, duration, settleMs])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
