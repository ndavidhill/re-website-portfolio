'use client'

import {motion, useReducedMotion} from 'framer-motion'
import {Fragment, createElement, type ElementType} from 'react'
import {animation} from '@/lib/design'

interface Props {
  /** Heading text. Use \n for an explicit line break. */
  text: string
  /** Render-as element. Defaults to h2. */
  as?: ElementType
  className?: string
  /** Delay before the first word starts animating, in seconds. */
  delay?: number
  /** Stagger between successive words. */
  stagger?: number
  /** Per-word animation duration. */
  duration?: number
}

/**
 * Per-word slide-up reveal, masked by an overflow:hidden wrapper around each
 * word so the motion looks like the text is rising into place from below the
 * baseline. Triggered once when the element scrolls into view.
 *
 * Used for major section headings on the homepage (TLDR, Our Work, etc.) and
 * the case study title.
 */
export function AnimatedHeading({
  text,
  as = 'h2',
  className,
  delay = 0,
  stagger = animation.stagger.tight,
  duration = animation.duration.long,
}: Props) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return createElement(
      as,
      {className},
      text.split('\n').map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      )),
    )
  }

  const lines = text.split('\n')
  let wordIndex = 0

  return createElement(
    as,
    {className},
    lines.map((line, li) => (
      <Fragment key={li}>
        {li > 0 && <br />}
        {line.split(/(\s+)/).map((token, ti) => {
          // Preserve whitespace tokens between words exactly as-is so the
          // measured layout doesn't shift.
          if (/^\s+$/.test(token)) {
            return <Fragment key={`ws-${ti}`}>{token}</Fragment>
          }
          const i = wordIndex++
          return (
            <span
              key={`w-${ti}`}
              className="inline-block overflow-hidden align-bottom"
              // Match the heading's line-height so the clip mask is the
              // right vertical size for the word's bounding box.
              style={{lineHeight: 'inherit', paddingBottom: '0.12em'}}
            >
              <motion.span
                className="inline-block"
                initial={{y: '100%'}}
                whileInView={{y: 0}}
                viewport={{once: true, margin: '0px 0px -80px 0px'}}
                transition={{
                  duration,
                  ease: animation.ease,
                  delay: delay + i * stagger,
                }}
              >
                {token}
              </motion.span>
            </span>
          )
        })}
      </Fragment>
    )),
  )
}
