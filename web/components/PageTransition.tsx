'use client'

import {ViewTransition} from 'react'
import {usePathname} from 'next/navigation'
import type {ReactNode} from 'react'

/**
 * Cross-route page transition (View Transitions API via React's
 * <ViewTransition>). Keyed by pathname so each navigation unmounts the old
 * page (`page-exit` class) and mounts the new one (`page-enter`) — the
 * animations live in globals.css: the new page rises from the bottom edge
 * as a full sheet (transition wipe) while the old page dims and drifts back
 * beneath it, on the site's ease-out-expo.
 *
 * `default="none"` keeps unrelated transitions from re-triggering the page
 * animation; unsupported browsers and initial loads swap instantly. The
 * fixed site header opts out via its own `view-transition-name: site-header`
 * (anchored in CSS) so the chrome holds still while content moves.
 */
export function PageTransition({children}: {children: ReactNode}) {
  const pathname = usePathname()
  return (
    <ViewTransition
      key={pathname}
      enter="page-enter"
      exit="page-exit"
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
