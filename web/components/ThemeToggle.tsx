'use client'

import {useEffect, useState} from 'react'
import {ui} from '@/lib/design'

type Theme = 'dark' | 'light'

/**
 * Dark/light toggle. Dark is the default; the icon is a crescent moon (see
 * `.theme-moon` in globals.css) that tweens to a full circle as the site shifts
 * to light. Theme is stored on `<html data-theme>` (+ localStorage); a brief
 * `theme-anim` class on <html> cross-fades the whole site during the switch.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

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
      className={`${ui.button.iconSm} text-text-primary hover:bg-surface focus-visible:bg-surface`}
    >
      <svg
        viewBox="0 0 18 18"
        className="h-[18px] w-[18px]"
        fill="currentColor"
        aria-hidden="true"
      >
        {/* Exact crescent path from Figma. */}
        <path d="M8.442 0C7.77882 0.617959 7.2469 1.36316 6.87797 2.19116C6.50904 3.01915 6.31067 3.91297 6.29468 4.8193C6.27869 5.72562 6.44541 6.62588 6.7849 7.46638C7.12439 8.30687 7.62969 9.07038 8.27065 9.71134C8.91162 10.3523 9.67513 10.8576 10.5156 11.1971C11.3561 11.5366 12.2564 11.7033 13.1627 11.6873C14.069 11.6713 14.9628 11.473 15.7908 11.104C16.6188 10.7351 17.364 10.2032 17.982 9.54C17.6958 14.2515 13.7844 17.9829 9.0009 17.9829C4.0293 17.9829 0 13.9536 0 8.9829C0 4.1994 3.7314 0.288 8.442 0Z" />
        {/* Grows from the centre to fill the crescent into a full circle. */}
        <circle className="tt-fill" cx="9" cy="9" r="9" />
      </svg>
    </button>
  )
}
