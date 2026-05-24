'use client'

import {useEffect, useRef, useState} from 'react'

/**
 * Tracks whether the referenced element is within `rootMargin` of the viewport.
 *
 * Used to mount/unmount heavy media (Vimeo iframes, autoplaying <video>) so only
 * clips near the viewport are live. Mobile browsers cap the number of
 * concurrently loading/playing inline videos — eagerly mounting every embed on a
 * video-heavy page leaves the later ones blank. Gating on view loads them
 * one-at-a-time as the user scrolls and frees decoders once they're far away.
 */
export function useInView<T extends Element>(rootMargin = '400px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      {rootMargin},
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return {ref, inView}
}
