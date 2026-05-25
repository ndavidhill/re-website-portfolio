'use client'

import Link from 'next/link'
import {useState} from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion'
import {ReLogo} from './ReLogo'
import {MobileNav} from './MobileNav'
import {NAV_ITEMS} from './nav-items'

// Reveal once the user scrolls up; hide once they scroll down past the header.
const HIDE_AFTER = 120
const DELTA = 6

export function SiteHeader({activeHref}: {activeHref?: string}) {
  const reduce = useReducedMotion()
  const {scrollY} = useScroll()
  const [hidden, setHidden] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    if (Math.abs(y - prev) < DELTA) return // ignore jitter
    if (y > prev && y > HIDE_AFTER) setHidden(true)
    else if (y < prev) setHidden(false)
  })

  return (
    <motion.header
      initial={false}
      animate={{y: hidden ? '-100%' : '0%'}}
      transition={reduce ? {duration: 0} : {duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
      className="fixed inset-x-0 top-0 z-50 flex flex-col items-center px-6 py-5 md:px-[60px]"
    >
      <div className="flex w-full max-w-[2000px] items-center justify-between">
        <Link
          href="/"
          aria-label="re.design home"
          className="pr-5 text-text-primary"
        >
          <ReLogo className="h-[30px] w-[50px]" />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex h-[32px] items-center gap-1.5 rounded-lg bg-text-muted/90 px-1 backdrop-blur-sm">
            {NAV_ITEMS.map((item) => {
              const isActive = !!activeHref && activeHref.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      'flex h-[25px] items-center rounded-lg px-2.5 text-[14.75px] leading-[18px] tracking-[-0.3px] transition-colors ' +
                      (isActive
                        ? 'bg-text-primary text-canvas'
                        : 'text-canvas/80 hover:bg-text-primary hover:text-canvas')
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <MobileNav activeHref={activeHref} />
      </div>
    </motion.header>
  )
}
