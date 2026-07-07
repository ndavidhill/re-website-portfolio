'use client'

import {useEffect, useRef, useState} from 'react'
import {gsap} from 'gsap'
import {useReducedMotion} from 'framer-motion'
import {urlForImage} from '@/lib/sanity'
import {MuteToggle} from '@/components/MuteToggle'
import type {LayerItem} from './LayersGrid'

const ASPECT: Record<LayerItem['ratio'], number> = {'4/5': 0.8, '1/1': 1, '16/9': 16 / 9}

/** Fit the item's aspect into the viewport, centred, leaving caption room. */
function targetRect(ratio: LayerItem['ratio']) {
  const ar = ASPECT[ratio]
  const maxW = Math.min(window.innerWidth * 0.86, 1280)
  const maxH = window.innerHeight * 0.72
  let w = maxW
  let h = w / ar
  if (h > maxH) {
    h = maxH
    w = h * ar
  }
  return {
    left: (window.innerWidth - w) / 2,
    top: (window.innerHeight - h) / 2 - window.innerHeight * 0.02,
    width: w,
    height: h,
  }
}

/**
 * Full-screen lightbox for a play tile. Opens with a FLIP from the tile's
 * frame (originEl) to a centred box on the site's expo ease; Esc, backdrop
 * click or the close button reverses it. The canvas is frozen by the caller
 * while this is open. Videos play with sound available via the shared
 * MuteToggle (muted until the visitor opts in). Reduced motion swaps the FLIP
 * for a plain fade.
 */
export function PlayLightbox({
  item,
  originEl,
  onClose,
}: {
  item: LayerItem
  originEl: HTMLElement | null
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const backdropRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const closingRef = useRef(false)
  const [muted, setMuted] = useState(true)
  const [target] = useState(() => targetRect(item.ratio))

  // Open: FLIP from the tile frame (or fade in when there's no origin).
  useEffect(() => {
    const backdrop = backdropRef.current
    const box = boxRef.current
    const chrome = chromeRef.current
    if (!backdrop || !box || !chrome) return

    const prevFocus = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()

    const dur = reduce ? 0 : 0.65
    gsap.fromTo(backdrop, {opacity: 0}, {opacity: 1, duration: reduce ? 0 : 0.4, ease: 'power2.out'})
    const origin = originEl?.getBoundingClientRect()
    if (origin && !reduce) {
      gsap.fromTo(
        box,
        {left: origin.left, top: origin.top, width: origin.width, height: origin.height},
        {...target, duration: dur, ease: 'expo.inOut'},
      )
    } else {
      gsap.fromTo(box, {...target, opacity: 0}, {...target, opacity: 1, duration: reduce ? 0 : 0.3})
    }
    gsap.fromTo(
      chrome,
      {opacity: 0},
      {opacity: 1, duration: reduce ? 0 : 0.35, delay: reduce ? 0 : dur * 0.55},
    )

    return () => {
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = () => {
    if (closingRef.current) return
    closingRef.current = true
    const backdrop = backdropRef.current
    const box = boxRef.current
    const chrome = chromeRef.current
    const origin = originEl?.getBoundingClientRect()
    if (!backdrop || !box || !chrome || reduce || !origin) {
      onClose()
      return
    }
    gsap.to(chrome, {opacity: 0, duration: 0.2})
    gsap.to(backdrop, {opacity: 0, duration: 0.45, delay: 0.15, ease: 'power2.in'})
    gsap.to(box, {
      left: origin.left,
      top: origin.top,
      width: origin.width,
      height: origin.height,
      duration: 0.55,
      ease: 'expo.inOut',
      onComplete: onClose,
    })
  }

  // Esc closes; Tab cycles within the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
        )
        if (!focusables || focusables.length === 0) return
        const list = [...focusables]
        const idx = list.indexOf(document.activeElement as HTMLElement)
        const next = e.shiftKey
          ? list[(idx - 1 + list.length) % list.length]
          : list[(idx + 1) % list.length]
        e.preventDefault()
        next.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      className="fixed inset-0 z-[80]"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={close}
        className="absolute inset-0 bg-canvas/90 backdrop-blur-md"
      />

      {/* Media box — FLIPs from the tile frame */}
      <div
        ref={boxRef}
        className="fixed overflow-hidden rounded-[12px]"
        style={{...target, backgroundColor: item.color}}
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlForImage(item.image).width(2000).auto('format').url()}
            alt={item.image.alt ?? item.caption}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : item.videoUrl ? (
          <>
            <video
              src={item.videoUrl}
              poster={
                item.poster
                  ? urlForImage(item.poster).width(1600).auto('format').url()
                  : undefined
              }
              autoPlay
              muted={muted}
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute bottom-3 right-3">
              <MuteToggle muted={muted} onToggle={() => setMuted((m) => !m)} size="sm" />
            </div>
          </>
        ) : null}
      </div>

      {/* Chrome: caption + close */}
      <div ref={chromeRef}>
        <button
          ref={closeBtnRef}
          type="button"
          aria-label="Close"
          onClick={close}
          className="fixed right-3 top-5 z-[81] flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-surface text-text-primary transition-colors hover:bg-text-primary hover:text-canvas md:right-[30px]"
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
        <p
          className="fixed text-sm leading-[22px] tracking-[-0.084px] text-text-secondary"
          style={{left: target.left, top: target.top + target.height + 14, maxWidth: target.width}}
        >
          {item.caption}
        </p>
      </div>
    </div>
  )
}
