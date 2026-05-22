'use client'

import {AnimatePresence, motion, useReducedMotion} from 'framer-motion'
import {useId, useState, type ReactNode} from 'react'
import {animation} from '@/lib/design'

export interface AccordionItem {
  /** Visible label, also used as the trigger button's accessible name. */
  title: string
  /** Body content. ReactNode so paragraphs, links, lists are all fine. */
  body: ReactNode
  /** Optional, stable per-item identifier for controlled state usage. */
  id?: string
}

interface Props {
  items: AccordionItem[]
  /** Allow multiple panels open simultaneously. Defaults to single-open. */
  allowMultiple?: boolean
  /** Indexes that should be open on first render. */
  defaultOpen?: number[]
  /** Wrapper className override. */
  className?: string
}

/**
 * Expand / collapse panels. Mirrors the Figma [Accordion 1.1] component
 * (nodes 119:1163 / 119:1164): light surface (mapped to our dark theme via
 * `bg-surface`), 14px Graphik Medium title, plus → minus icon, secondary body
 * copy that fades + expands smoothly. Height animation is tween-based using
 * the project's shared easing curve.
 */
export function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className,
}: Props) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(defaultOpen))

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        if (!allowMultiple) next.clear()
        next.add(i)
      }
      return next
    })
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      {items.map((item, i) => (
        <AccordionRow
          key={item.id ?? i}
          title={item.title}
          body={item.body}
          isOpen={open.has(i)}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  )
}

function AccordionRow({
  title,
  body,
  isOpen,
  onToggle,
}: {
  title: string
  body: ReactNode
  isOpen: boolean
  onToggle: () => void
}) {
  const panelId = useId()
  const prefersReduced = useReducedMotion()

  return (
    <div className="rounded-md bg-surface">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={
          'flex w-full cursor-pointer gap-2.5 p-3.5 text-left ' +
          (isOpen ? 'items-start' : 'items-center')
        }
      >
        <span className="min-w-0 flex-1 text-[14px] font-medium leading-5 tracking-[-0.084px] text-text-primary">
          {title}
        </span>
        <PlusMinusIcon isOpen={isOpen} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.section
            key="content"
            id={panelId}
            initial={prefersReduced ? false : {height: 0, opacity: 0}}
            animate={{height: 'auto', opacity: 1}}
            exit={prefersReduced ? {height: 0} : {height: 0, opacity: 0}}
            transition={{
              duration: animation.duration.medium,
              ease: animation.ease,
              opacity: {duration: animation.duration.short},
            }}
            className="overflow-hidden"
          >
            <div className="whitespace-pre-wrap px-3.5 pb-3.5 text-[14px] leading-5 tracking-[-0.084px] text-text-secondary">
              {body}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Plus icon when collapsed, minus when expanded. The vertical bar scales to 0
 * to morph between the two states, keeping the horizontal bar steady. Origin
 * pinned to the SVG centre so the collapse is symmetric.
 */
function PlusMinusIcon({isOpen}: {isOpen: boolean}) {
  return (
    <span
      aria-hidden="true"
      className="relative block h-5 w-5 shrink-0 text-text-primary"
    >
      <svg viewBox="0 0 20 20" className="absolute inset-0 h-full w-full">
        <rect x="3.75" y="9.5" width="12.5" height="1" fill="currentColor" />
        <motion.rect
          x="9.5"
          y="3.75"
          width="1"
          height="12.5"
          fill="currentColor"
          animate={{scaleY: isOpen ? 0 : 1}}
          transition={{
            duration: animation.duration.short,
            ease: animation.ease,
          }}
          style={{transformOrigin: '10px 10px'}}
        />
      </svg>
    </span>
  )
}
