'use client'

import {motion, useReducedMotion, useScroll, useTransform} from 'framer-motion'
import {useEffect, useRef, useState} from 'react'
import {MuteToggle} from '@/components/MuteToggle'
import {scroll} from '@/lib/design'

const INIT_WIDTH = 788
const INIT_HEIGHT = 443
const DOCK_WIDTH = 340
const DOCK_HEIGHT = 191
const DOCK_MARGIN = 24
const DOCK_SCALE = DOCK_WIDTH / INIT_WIDTH // 0.4315

// Scroll band over which the video animates from centered to docked.
// Tweak via `scroll.heroVideoTrigger` in lib/design.ts.
const TRIGGER_START = scroll.heroVideoTrigger.start
const TRIGGER_END = scroll.heroVideoTrigger.end

interface Props {
  src: string
  poster?: string
}

export function StickyHomeVideo({src, poster}: Props) {
  const prefersReduced = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [viewport, setViewport] = useState({w: 1440, h: 900, ready: false})

  useEffect(() => {
    const update = () =>
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
        ready: true,
      })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // The motion track. We always declare the same hooks so the order is stable
  // across renders even when reduced motion is preferred.
  const {scrollY} = useScroll()
  const progress = useTransform(
    scrollY,
    [TRIGGER_START, TRIGGER_END],
    [0, 1],
    {clamp: true},
  )

  // Top-left position so the element is visually centered (p=0) or
  // anchored to the bottom-right corner with DOCK_MARGIN gutter (p=1).
  // Scale uses transform-origin: top-left so width/height are layout-stable.
  const centerX = (viewport.w - INIT_WIDTH) / 2
  const centerY = (viewport.h - INIT_HEIGHT) / 2
  const dockX = viewport.w - DOCK_MARGIN - DOCK_WIDTH
  const dockY = viewport.h - DOCK_MARGIN - DOCK_HEIGHT

  const x = useTransform(progress, [0, 1], [centerX, dockX])
  const y = useTransform(progress, [0, 1], [centerY, dockY])
  const scale = useTransform(progress, [0, 1], [1, DOCK_SCALE])

  // Autoplay on mount (muted, per browser policy). Catch to silence DOMExceptions
  // when autoplay is blocked — the user can still tap to play.
  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [])

  const toggleMute = () => {
    const el = videoRef.current
    if (!el) return
    const next = !muted
    el.muted = next
    setMuted(next)
    // Make sure playback resumes if the user enables sound.
    if (!next) el.play().catch(() => {})
  }

  // Until we know the viewport size, render the centered state via CSS so the
  // initial paint isn't anchored to (0,0). This avoids a flash before hydration.
  if (!viewport.ready) {
    return (
      <div
        className="pointer-events-none fixed left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[15px] shadow-2xl"
        style={{width: INIT_WIDTH, height: INIT_HEIGHT}}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  if (prefersReduced) {
    return (
      <div
        className="fixed bottom-6 right-6 z-30 overflow-hidden rounded-[15px] shadow-2xl"
        style={{width: DOCK_WIDTH, height: DOCK_HEIGHT}}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-3 right-3">
          <MuteToggle muted={muted} onToggle={toggleMute} size="sm" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      aria-hidden={false}
      className="fixed left-0 top-0 z-30 origin-top-left overflow-hidden rounded-[15px] shadow-2xl"
      style={{
        x,
        y,
        scale,
        width: INIT_WIDTH,
        height: INIT_HEIGHT,
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <MuteToggle muted={muted} onToggle={toggleMute} size="lg" />
      </div>
    </motion.div>
  )
}
