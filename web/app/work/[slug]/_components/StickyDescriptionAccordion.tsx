'use client'

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import {useEffect, useRef, useState} from 'react'
import {Accordion, type AccordionItem} from '@/components/Accordion'
import type {DescriptionAccordionItem} from '@/lib/sanity'

interface Props {
  items: DescriptionAccordionItem[]
  fallbackSummary?: string
  /** Optional className appended to the wrapper — useful for `hidden xl:block`. */
  className?: string
}

const WIDTH = 440
const INITIAL_TOP = 130   // header (110px) + intro top padding (20px)
const INITIAL_RIGHT = 60  // page gutter
const DOCK_BOTTOM = 24
const DOCK_RIGHT = 24
const TRIGGER_START = 220
const TRIGGER_END = 720

/**
 * The case study description as a sticky accordion overlay. Always rendered
 * `position: fixed` so it floats above the body content (z-50). Initial
 * position sits in the intro's right column (`top: 130; right: 60`); as the
 * user scrolls past the intro, it morphs to the bottom-right corner
 * (`bottom: 24; right: 24`) and locks there.
 *
 * Body imagery still spans the full content wrapper because this element is
 * outside the normal flow — the layout doesn't reserve a column for it.
 */
export function StickyDescriptionAccordion({
  items,
  fallbackSummary,
  className,
}: Props) {
  const prefersReduced = useReducedMotion()
  const accordionRef = useRef<HTMLDivElement>(null)
  const [viewportH, setViewportH] = useState<number>(900)
  const [accordionH, setAccordionH] = useState<number>(400)

  // Hydrate viewport size + listen for resize.
  useEffect(() => {
    const update = () => setViewportH(window.innerHeight)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Track the accordion's own height so the docked position lands flush with
  // the bottom of the viewport regardless of how many panels are open.
  useEffect(() => {
    if (!accordionRef.current) return
    const ro = new ResizeObserver((entries) => {
      const e = entries[0]
      if (e) setAccordionH(e.contentRect.height)
    })
    ro.observe(accordionRef.current)
    return () => ro.disconnect()
  }, [])

  const accordionItems: AccordionItem[] = items.length
    ? items.map((item) => ({
        id: item._key,
        title: item.title,
        body: item.body ?? '',
      }))
    : fallbackSummary
    ? [{title: 'Description', body: fallbackSummary}]
    : []

  // Scroll progress drives both top (vertical morph) and right (horizontal
  // morph from page gutter into the docked corner). Hooks live above any
  // early-return so the order is stable across renders.
  const {scrollY} = useScroll()
  const progress = useTransform(
    scrollY,
    [TRIGGER_START, TRIGGER_END],
    [0, 1],
    {clamp: true},
  )

  const dockedTop = Math.max(INITIAL_TOP, viewportH - accordionH - DOCK_BOTTOM)
  const top: MotionValue<number> = useTransform(progress, [0, 1], [INITIAL_TOP, dockedTop])
  const right: MotionValue<number> = useTransform(
    progress,
    [0, 1],
    [INITIAL_RIGHT, DOCK_RIGHT],
  )

  if (accordionItems.length === 0) return null

  // Reduced motion: skip the morph; render docked immediately.
  if (prefersReduced) {
    return (
      <div
        className={
          'fixed z-50 hidden xl:block ' + (className ?? '')
        }
        style={{bottom: DOCK_BOTTOM, right: DOCK_RIGHT, width: WIDTH}}
      >
        <div ref={accordionRef}>
          <Accordion items={accordionItems} defaultOpen={[0]} />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={'fixed z-50 hidden xl:block ' + (className ?? '')}
      style={{top, right, width: WIDTH}}
    >
      <div ref={accordionRef}>
        <Accordion items={accordionItems} defaultOpen={[0]} />
      </div>
    </motion.div>
  )
}
