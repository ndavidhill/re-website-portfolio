'use client'

import {useEffect, useId, useState} from 'react'
import {ui} from '@/lib/design'

type Theme = 'dark' | 'light'

/**
 * Dark/light toggle. Dark is the default; the icon is a moon disc with a
 * masked "shadow" disc bitten out of it (crescent). Toggling slides the
 * shadow off along the diagonal while the icon rotates, so the crescent
 * visibly waxes to a full circle — and wanes back when returning to dark.
 * Hovering previews the motion (the shadow creeps toward its destination).
 * All choreography lives in globals.css (`.tt-moon` / `.tt-shadow`).
 *
 * Theme is stored on `<html data-theme>` (+ localStorage); a brief
 * `theme-anim` class on <html> cross-fades the whole site during the switch.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const maskId = useId()

  // The no-FOUC script in <head> may have set data-theme before hydration.
  // Sync the label after paint (deferred so it isn't a synchronous effect set,
  // and matches the SSR 'dark' render to avoid a hydration mismatch).
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'),
    )
    return () => cancelAnimationFrame(id)
  }, [])

  const toggle = () => {
    const root = document.documentElement
    const next: Theme = root.dataset.theme === 'light' ? 'dark' : 'light'
    root.classList.add('theme-anim')
    if (next === 'light') root.dataset.theme = 'light'
    else delete root.dataset.theme
    try {
      localStorage.setItem('theme', next)
    } catch {}
    setTheme(next)
    window.setTimeout(() => root.classList.remove('theme-anim'), 520)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={theme === 'light'}
      className={`${ui.button.iconSm} theme-toggle text-text-primary`}
    >
      <svg
        viewBox="0 0 24 24"
        className="tt-moon h-[24px] w-[24px]"
        aria-hidden="true"
      >
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-16" y="-16" width="56" height="56">
          <rect x="-16" y="-16" width="56" height="56" fill="white" />
          {/* The moon's shadow — overlaps the disc to carve the crescent in
              dark mode, slides clear of it in light mode (see globals.css). */}
          <circle className="tt-shadow" cx="19" cy="5" r="9" fill="black" />
        </mask>
        <circle cx="12" cy="12" r="9" fill="currentColor" mask={`url(#${maskId})`} />
      </svg>
    </button>
  )
}
