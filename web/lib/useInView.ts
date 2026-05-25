'use client'

import {useEffect, useRef, useState} from 'react'

/**
 * Latches `true` the first time the referenced element comes within `rootMargin`
 * of the viewport, then stops observing — so it never flips back to `false`.
 *
 * Used to mount heavy media (Vimeo iframes, autoplaying <video>) lazily without
 * churn: clips load progressively as the user approaches them (avoiding the
 * mobile concurrent-load cap that left eagerly-mounted embeds blank) but, once
 * mounted, stay mounted so scrolling back doesn't reload them. The generous
 * default margin preloads roughly a screen ahead so they're ready before they
 * scroll into view, avoiding pop-in.
 */
export function useInView<T extends Element>(rootMargin = '1000px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
          io.disconnect() // Latch — once loaded, stay loaded.
        }
      },
      {rootMargin},
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return {ref, inView}
}
