'use client'

import {useEffect, useState} from 'react'
import Image from 'next/image'

interface Props {
  darkUrl?: string
  lightUrl?: string
  posterUrl?: string
  alt?: string
}

/**
 * Theme-aware hero video. Two sources (dark + light); the active one is chosen
 * from `<html data-theme>` and re-selected when the visitor toggles the theme.
 *
 * SSR safety: we render the poster only on the server (theme === null), then
 * swap in the correct video element on hydration once we've read the live
 * theme. This avoids both the hydration mismatch warning and the
 * load-dark-then-swap-to-light flash a light-mode visitor would otherwise see.
 *
 * If only one URL is provided, that one plays for both themes; if both are
 * missing the poster stands in alone.
 */
export function InfoHero({darkUrl, lightUrl, posterUrl, alt}: Props) {
  const [theme, setTheme] = useState<'dark' | 'light' | null>(null)

  useEffect(() => {
    const read = () =>
      setTheme(
        document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
      )
    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => obs.disconnect()
  }, [])

  const src =
    theme === 'light' ? lightUrl ?? darkUrl : darkUrl ?? lightUrl

  return (
    <div className="relative aspect-[1320/866] w-full overflow-hidden rounded-[4px] bg-surface md:rounded-[16px]">
      {posterUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl}
          alt={alt ?? ''}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {theme && src && (
        <video
          key={src}
          src={src}
          poster={posterUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}

// `<Image>` is imported but not used in the current render path — left in for
// the future case where we want a static image fallback on `prefers-reduced-
// motion`. Keep the export tree-shakeable by referencing it nowhere else.
void Image
