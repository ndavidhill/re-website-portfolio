'use client'

import {motion, useReducedMotion} from 'framer-motion'
import {Children, type ReactNode} from 'react'
import {animation} from '@/lib/design'

type RevealProps = {
  children: ReactNode
  className?: string
  /** Seconds to wait before this element animates. */
  delay?: number
  /** Vertical offset to animate from, in px. */
  offset?: number
  /** Animation duration in seconds. */
  duration?: number
  /** Negative root margin so animation triggers slightly before fully visible. */
  rootMarginPx?: number
}

export function Reveal({
  children,
  className,
  delay = 0,
  offset = animation.reveal.offset,
  duration = animation.duration.medium,
  rootMarginPx = animation.reveal.rootMarginPx,
}: RevealProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{opacity: 0, y: offset}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: `0px 0px -${rootMarginPx}px 0px`}}
      transition={{duration, ease: animation.ease, delay}}
    >
      {children}
    </motion.div>
  )
}

type StaggerProps = {
  children: ReactNode
  /** Seconds between successive children. */
  stagger?: number
  /** Initial wait before the group starts. */
  delay?: number
}

/**
 * Wrap a list of siblings to reveal them in sequence on scroll. Each direct
 * child gets its own Reveal with computed delay, so structural / semantic
 * markup inside (figure, li, etc.) is preserved.
 */
export function RevealStagger({
  children,
  stagger = animation.stagger.normal,
  delay = 0,
}: StaggerProps) {
  return (
    <>
      {Children.map(children, (child, i) => (
        <Reveal key={i} delay={delay + i * stagger}>
          {child}
        </Reveal>
      ))}
    </>
  )
}
