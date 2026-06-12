'use client'

import Link from 'next/link'
import {useState} from 'react'
import {usePathname} from 'next/navigation'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion'
import {ReLogo} from './ReLogo'
import {MobileNav} from './MobileNav'
import {ThemeToggle} from './ThemeToggle'
import {DESKTOP_NAV_ITEMS} from './nav-items'

// Reveal once the user scrolls up; hide once they scroll down past the header.
const HIDE_AFTER = 120
// Fade in the backdrop once scrolled off the top (transparent over the hero).
const BACKDROP_AFTER = 80
const DELTA = 6

export function SiteHeader({activeHref}: {activeHref?: string}) {
  const reduce = useReducedMotion()
  const {scrollY} = useScroll()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Pages may pass activeHref to pin a section (e.g. case studies → /work);
  // otherwise the live pathname drives the active pill (so "/" lights up
  // Re.design without every page threading a prop).
  const pathname = usePathname()
  const active = activeHref ?? pathname

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > BACKDROP_AFTER)
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
      className="fixed inset-x-0 top-0 z-50 flex flex-col items-center px-3 py-5 md:px-[30px]"
      // Anchored during route view transitions (see globals.css) so the
      // chrome holds still while page content animates beneath it.
      style={{viewTransitionName: 'site-header'}}
    >
      {/* Backdrop: transparent at the top (over the hero), fades to a blurred
          bar once scrolled so the logo/nav read over busy media. */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{opacity: scrolled ? 1 : 0}}
        transition={reduce ? {duration: 0} : {duration: 0.3}}
        className="absolute inset-0 -z-10 border-b border-border/50 bg-canvas/70 backdrop-blur-md"
      />

      <div className="flex w-full max-w-[2000px] items-center justify-between">
        <Link
          href="/"
          aria-label="re.design home"
          className="pr-5 text-text-primary"
        >
          <ReLogo className="h-[30px] w-[50px]" />
        </Link>

        {/* Right cluster — DOM order [pills][toggle][hamburger] gives the right
            placement in both layouts: desktop shows pills + toggle (toggle right
            of the nav); mobile shows toggle + hamburger (toggle to its left).
            Desktop nav per Figma 406:7297: each item is its own pill (h-25,
            px-10, r-8, 4px gaps) in a blurred wrapper, moon button outside. */}
        <div className="flex items-center gap-2 md:gap-3">
          <nav
            aria-label="Primary"
            className="hidden rounded-[8px] px-1 backdrop-blur-[6px] md:block"
          >
            <ul className="flex h-[30px] items-center gap-1">
              {DESKTOP_NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/'
                    ? active === '/'
                    : active.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={
                        'flex h-[25px] items-center justify-center rounded-[8px] px-2.5 pb-[2px] text-[14.766px] leading-[18px] tracking-[-0.3px] transition-colors duration-200 ' +
                        (isActive
                          ? 'bg-[var(--nav-pill-bg-active)] text-[var(--nav-pill-fg-active)]'
                          : 'bg-[var(--nav-pill-bg)] text-[var(--nav-pill-fg)] hover:bg-[var(--nav-pill-bg-hover)] focus-visible:bg-[var(--nav-pill-bg-hover)]')
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <ThemeToggle />

          <MobileNav activeHref={activeHref} />
        </div>
      </div>
    </motion.header>
  )
}
