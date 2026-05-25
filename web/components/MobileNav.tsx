'use client'

import {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'
import Link from 'next/link'
import {NAV_ITEMS} from './nav-items'

/**
 * Mobile-only navigation: a hamburger button that opens a full-screen overlay
 * of the primary nav. Hidden at md+ where the desktop pill nav takes over.
 *
 * The overlay is portalled to <body> so it isn't confined by the SiteHeader's
 * transform (an ancestor transform makes `position: fixed` resolve against that
 * ancestor instead of the viewport).
 */
export function MobileNav({activeHref}: {activeHref?: string}) {
  const [open, setOpen] = useState(false)

  // Lock body scroll while the menu is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-text-muted/90 text-canvas backdrop-blur-sm"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            id="mobile-menu"
            className="fixed inset-0 z-[60] flex flex-col bg-canvas px-6 py-5"
          >
            <div className="flex items-center justify-end">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-text-muted/90 text-canvas"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <nav aria-label="Primary" className="mt-8 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = !!activeHref && activeHref.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={
                    'text-[40px] font-medium leading-[44px] tracking-[-0.6px] transition-colors ' +
                    (isActive
                      ? 'text-text-primary'
                      : 'text-text-faint hover:text-text-primary')
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          </div>,
          document.body,
        )}
    </div>
  )
}
