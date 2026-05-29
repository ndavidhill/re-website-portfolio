'use client'

import {useEffect, useRef} from 'react'
import {gsap} from 'gsap'
import {Observer} from 'gsap/Observer'
import {useReducedMotion} from 'framer-motion'

// Plugin registration is idempotent — safe in the client bundle.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Observer)
}

export interface GalleryItem {
  caption: string
  /** CSS aspect-ratio string — drives item width given the shared row height. */
  ratio: '4/5' | '1/1' | '16/9'
  /** Background colour of the placeholder tile. */
  color: string
}

interface Props {
  items: GalleryItem[]
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
 * Ported from t11.com's WebGL gallery. Their shader path is
 *   sign(d * 12) * pow(|d * 12|, 2.2) * 0.5
 * where `d` is smoothed per-frame world-unit displacement. We rescale the
 * input so pixel-space delta produces an equivalent ramp: at idle drift
 * (≈0.5 px/frame) warp stays near zero; at active drag (≈30+ px/frame) it
 * saturates to the clamp. The pow gives the punchy non-linear ramp — small
 * deltas stay calm, hard flicks immediately read.
 */
const DELTA_TO_WARP_SCALE = 0.6

/** Max horizontal stretch as a fraction (scaleX = 1 + this × |warp|). */
const STRETCH_X = 0.18
/** Max vertical squash as a fraction (scaleY = 1 − this × |warp|). */
const SQUASH_Y = 0.12

/**
 * Auto-drifting infinite horizontal gallery with a velocity-driven bulge/pinch
 * effect ported from t11.com's WebGL implementation.
 *
 * - **Drift**: every frame the track advances at BASE_VELOCITY plus a decaying
 *   boost. Wheel events bump the boost; drag scrubs `pos` directly.
 * - **Loop**: items are rendered twice; `pos` wraps modulo the width of one
 *   set (measured at runtime via `offsetLeft`, not `scrollWidth/2`, so the
 *   gap utility is accounted for exactly).
 * - **Warp**: each tile reads `--warp-x` / `--warp-y` from the track via CSS
 *   custom-property inheritance and applies a scale transform. The warp value
 *   is the smoothed, non-linearly ramped per-frame displacement — the same
 *   maths t11 uses for `uWarpIntensity`, applied as CSS instead of GLSL since
 *   our tiles are solid colours (no per-vertex texture displacement to worry
 *   about).
 *
 * Respects `prefers-reduced-motion`: skips the GSAP ticker, the Observer, and
 * the warp entirely. Items render as a static horizontally-scrollable row.
 */
export function InfiniteGallery({items}: Props) {
  const trackRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return

    // The loop period = distance from first item of set A to first item of
    // set B (which is `items.length` indices later in DOM order). Reading
    // offsetLeft is robust across responsive sizes and the gap utility — we
    // don't have to redo the W + N*gap math by hand.
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
      gsap.set(track, {x: -pos})

      // Per-frame displacement, wrap-aware. When `pos` jumps from near
      // stripWidth back to ~0 the raw diff is huge in the wrong direction;
      // unwrap by adding/subtracting the period.
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
      // Don't preventDefault — the page should still scroll past the gallery
      // to reach the footer. Wheel both nudges and page-scrolls; the boost is
      // small enough that the dual behaviour reads as a hint, not a hijack.
      preventDefault: false,
      onWheel(self) {
        const dy = Math.max(
          -WHEEL_DELTA_CAP,
          Math.min(WHEEL_DELTA_CAP, self.deltaY),
        )
        boost += dy * WHEEL_DELTA_SCALE
      },
      onDrag(self) {
        // Drag right → reveal items further back (pos decreases).
        pos -= self.deltaX
      },
      onDragEnd(self) {
        // Flick: carry release velocity into the decaying boost.
        boost -= self.velocityX * 0.35
      },
    })

    return () => {
      gsap.ticker.remove(tick)
      ro.disconnect()
      observer.kill()
    }
  }, [reduce, items.length])

  // Duplicate items so the loop wraps invisibly. Aria-hidden on the duplicates
  // so screen readers don't double-announce.
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
         * The tile element reads --warp-x / --warp-y from the track via CSS
         * inheritance. Defaults of 1/1 keep it identity until the ticker
         * starts writing. Caption stays unwarped so text remains legible.
         */}
        <div
          className="h-[220px] rounded-[4px] md:h-[420px] md:rounded-[16px]"
          style={{
            backgroundColor: item.color,
            aspectRatio: item.ratio,
            transform: 'scaleX(var(--warp-x, 1)) scaleY(var(--warp-y, 1))',
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        />
        <figcaption className="text-xs leading-4 tracking-[-0.084px] text-text-secondary md:text-sm md:leading-[22px]">
          {item.caption}
        </figcaption>
      </figure>
    </li>
  )
}
