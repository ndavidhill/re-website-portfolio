'use client'

import {useEffect, useRef} from 'react'
import Image from 'next/image'
import {gsap} from 'gsap'
import {Observer} from 'gsap/Observer'
import {useReducedMotion} from 'framer-motion'
import {urlForImage, type SanityImage} from '@/lib/sanity'

// Plugin registration is idempotent — safe in the client bundle.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Observer)
}

export interface GalleryItem {
  caption: string
  /** CSS aspect-ratio string — drives item width given the shared row height. */
  ratio: '4/5' | '1/1' | '16/9'
  /** Fallback tile colour when no media is present. */
  color: string
  /** Optional Sanity image (takes precedence over video). */
  image?: SanityImage
  /** Optional video URL (Sanity-hosted MP4 etc). */
  videoUrl?: string
  /** Optional poster for the video. */
  poster?: SanityImage
}

interface Props {
  items: GalleryItem[]
  /**
   * +1 drifts items right-to-left (default). -1 drifts left-to-right. Wheel and
   * drag interact in screen space — they always move with the user's finger /
   * scroll direction regardless of which way the row is auto-drifting.
   */
  direction?: 1 | -1
}

// ──────────────────────────────────────────────────────────────────────────────
// Motion model
// ──────────────────────────────────────────────────────────────────────────────

/** Base ambient drift speed (px/sec). Always running. */
const BASE_VELOCITY = 28

/** Per-frame decay of the user-driven velocity boost (wheel + drag-release). */
const BOOST_DECAY = 0.92

/** Wheel events deliver wildly different deltas across devices; clamp + scale. */
const WHEEL_DELTA_CAP = 50
const WHEEL_DELTA_SCALE = 8

/** Lerp factor for smoothing the per-frame displacement before deriving warp. */
const DELTA_SMOOTHING = 0.25

/** Lerp factor for warp's approach to its target. Lower = lazier follow. */
const WARP_SMOOTHING = 0.2

/** Maximum absolute warp magnitude — caps the stretch/squash at the extreme. */
const WARP_CLAMP = 1.5

/**
 * Ported from t11.com's WebGL gallery shader path:
 *   sign(d × 12) × pow(|d × 12|, 2.2) × 0.5
 * where `d` is smoothed per-frame world-unit displacement. Rescaled so our
 * pixel-space delta produces an equivalent ramp.
 */
const DELTA_TO_WARP_SCALE = 0.6

/** Max horizontal stretch as a fraction (scaleX = 1 + this × |warp|). */
const STRETCH_X = 0.18
/** Max vertical squash as a fraction (scaleY = 1 − this × |warp|). */
const SQUASH_Y = 0.12

/**
 * Auto-drifting infinite horizontal gallery with t11-style velocity warp.
 *
 * The motion model keeps `pos` monotonically advancing (modulo the loop
 * period) and applies the row's drift direction only at render time via
 * `x = -pos * direction`. That way:
 *   - The two rows can drift in opposite directions just by passing `1` vs
 *     `-1` — no internal branching on direction.
 *   - Drag is always in screen-space (drag right → items follow right).
 *   - Wheel "forward" always advances along the row's drift direction.
 *   - Warp magnitude is identical between rows at the same |velocity|.
 */
export function InfiniteGallery({items, direction = 1}: Props) {
  const trackRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return

    // Loop period = distance from first item of set A to first item of set B
    // (which is `items.length` indices later in DOM order). Reading offsetLeft
    // is robust across responsive sizes + gap utility — no W + N*gap math.
    let stripWidth = 0
    const measure = () => {
      const tiles = track.querySelectorAll<HTMLElement>(':scope > li')
      if (tiles.length < items.length + 1) return
      stripWidth = tiles[items.length].offsetLeft - tiles[0].offsetLeft
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)

    let pos = 0
    let prevPos = 0
    let boost = 0
    let smoothedDelta = 0
    let warp = 0

    const tick = (_time: number, deltaTime: number) => {
      const dt = deltaTime / 1000
      pos += (BASE_VELOCITY + boost) * dt
      boost *= Math.pow(BOOST_DECAY, deltaTime / 16.67)
      if (stripWidth > 0) {
        pos = ((pos % stripWidth) + stripWidth) % stripWidth
      }
      // Render mapping. Items sit at DOM offsets [0, 2 * stripWidth] (originals
      // then duplicates). We want translateX to live in the range
      // [-stripWidth, 0] for both directions so the duplicates can always fill
      // whichever side the originals are vacating:
      //   - direction +1 (drift left):  pos 0 → stripWidth, tx 0 → -stripWidth.
      //     Originals leave right-to-left; duplicates slide in from the right.
      //   - direction -1 (drift right): pos 0 → stripWidth, tx -stripWidth → 0.
      //     Duplicates start in the viewport (translated left by stripWidth)
      //     and slide right; originals follow them in from the left.
      // The wrap at pos→stripWidth snaps tx to the other end of the range —
      // visually a no-op because the items at the new tx are duplicates of the
      // ones that were just there.
      const tx =
        stripWidth === 0
          ? 0
          : direction === 1
          ? -pos
          : pos - stripWidth
      gsap.set(track, {x: tx})

      let dp = pos - prevPos
      if (stripWidth > 0) {
        if (dp > stripWidth / 2) dp -= stripWidth
        else if (dp < -stripWidth / 2) dp += stripWidth
      }
      prevPos = pos

      smoothedDelta += (dp - smoothedDelta) * DELTA_SMOOTHING

      const scaled = smoothedDelta * DELTA_TO_WARP_SCALE
      const rawTarget = Math.sign(scaled) * Math.pow(Math.abs(scaled), 2.2) * 0.5
      const target = Math.max(-WARP_CLAMP, Math.min(WARP_CLAMP, rawTarget))
      warp += (target - warp) * WARP_SMOOTHING

      // CSS vars on the track cascade to every tile via inheritance — one
      // write per frame instead of N writes.
      const absW = Math.abs(warp)
      track.style.setProperty('--warp-x', String(1 + absW * STRETCH_X))
      track.style.setProperty('--warp-y', String(1 - absW * SQUASH_Y))
    }
    gsap.ticker.add(tick)

    const observer = Observer.create({
      target: container,
      type: 'wheel,touch,pointer',
      wheelSpeed: 1,
      preventDefault: false,
      onWheel(self) {
        const dy = Math.max(
          -WHEEL_DELTA_CAP,
          Math.min(WHEEL_DELTA_CAP, self.deltaY),
        )
        // No direction multiplier: pos always advances forward; the render
        // mapping handles the visual direction.
        boost += dy * WHEEL_DELTA_SCALE
      },
      onDrag(self) {
        // Drag is screen-space: dragging right pulls items right regardless
        // of the row's drift direction. d(pos) = -d(physicalX) / direction.
        pos -= self.deltaX * direction
      },
      onDragEnd(self) {
        // Flick momentum, also screen-space. Same direction sign as drag.
        boost -= self.velocityX * 0.35 * direction
      },
    })

    return () => {
      gsap.ticker.remove(tick)
      ro.disconnect()
      observer.kill()
    }
  }, [reduce, items.length, direction])

  const doubled = [...items, ...items]

  return (
    <div
      ref={containerRef}
      aria-label="Gallery"
      role="region"
      className="relative w-full select-none overflow-hidden"
    >
      <ul
        ref={trackRef}
        className="flex w-max items-start gap-5 md:gap-6"
        style={{willChange: 'transform'}}
      >
        {doubled.map((item, i) => (
          <GalleryFigure
            key={i}
            item={item}
            ariaHidden={i >= items.length}
          />
        ))}
      </ul>
    </div>
  )
}

function GalleryFigure({
  item,
  ariaHidden,
}: {
  item: GalleryItem
  ariaHidden: boolean
}) {
  return (
    <li className="shrink-0" aria-hidden={ariaHidden || undefined}>
      <figure className="flex flex-col gap-3">
        {/*
         * Tile reads --warp-x / --warp-y from the track via CSS inheritance
         * and applies the scale transform. Defaults of 1/1 keep it identity
         * until the ticker starts writing. Caption stays unwarped.
         */}
        <div
          className="relative h-[220px] overflow-hidden rounded-[4px] md:h-[420px] md:rounded-[16px]"
          style={{
            backgroundColor: item.color,
            aspectRatio: item.ratio,
            transform: 'scaleX(var(--warp-x, 1)) scaleY(var(--warp-y, 1))',
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <TileMedia item={item} />
        </div>
        <figcaption className="text-xs leading-4 tracking-[-0.084px] text-text-secondary md:text-sm md:leading-[22px]">
          {item.caption}
        </figcaption>
      </figure>
    </li>
  )
}

/**
 * Render the editor-provided media — image wins over video if both are set.
 * Falls back to nothing (the tile's solid `color` background shows through),
 * so empty Sanity entries still leave the row visually intact.
 */
function TileMedia({item}: {item: GalleryItem}) {
  if (item.image) {
    const src = urlForImage(item.image).width(1200).auto('format').url()
    return (
      <Image
        src={src}
        alt={item.image.alt ?? item.caption}
        fill
        sizes="(min-width: 768px) 50vw, 80vw"
        className="object-cover"
      />
    )
  }
  if (item.videoUrl) {
    const posterSrc = item.poster
      ? urlForImage(item.poster).width(1200).auto('format').url()
      : undefined
    return (
      <video
        src={item.videoUrl}
        poster={posterSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={item.caption}
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }
  return null
}
