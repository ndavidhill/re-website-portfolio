'use client'

import {useEffect, useRef, useState} from 'react'
import {gsap} from 'gsap'
import {useReducedMotion} from 'framer-motion'
import {urlForImage, type SanityImage} from '@/lib/sanity'

export interface LayerItem {
  caption: string
  ratio: '4/5' | '1/1' | '16/9'
  color: string
  image?: SanityImage
  videoUrl?: string
  poster?: SanityImage
}

// ──────────────────────────────────────────────────────────────────────────────
// Motion model — ported from Jorge Toloza's "Infinite Layers Grid" (Codrops),
// adapted to React + Sanity media. Original: DOM tiles translated each frame
// over a lerp-smoothed 2D scroll; per-tile random `ease` gives the layered
// parallax depth; the strip is tiled and wrapped by ±pattern size for the
// infinite illusion. We generalise the reference's fixed 2×2 tiling to cover
// any viewport (it otherwise leaves gaps on tall / mobile screens).
// ──────────────────────────────────────────────────────────────────────────────

const SCROLL_EASE = 0.06
const WHEEL_FACTOR = 0.4
const DELTA_EASE = 0.04
const MOUSE_EASE = 0.04
const DRIFT_GAIN = 5 // scroll-velocity push multiplier
const MOUSE_PARALLAX = 0.6 // cursor parallax as a fraction of tile size
const IMG_OVERSCALE = 1.2 // base image zoom so inner parallax never shows edges
const PRESS_ZOOM = 0.2 // extra zoom while dragging

const ASPECT: Record<LayerItem['ratio'], number> = {'4/5': 0.8, '1/1': 1, '16/9': 16 / 9}

/** Deterministic pseudo-random in [0,1) — keeps the scatter stable across renders. */
function rnd(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Virtual layout space the hand-tuned scatter is authored in. */
const CW = 1600
const CH = 1200

interface BaseTile {
  item: LayerItem
  x: number
  y: number
  w: number
  h: number
}

interface PhysTile {
  x: number
  y: number
  w: number
  h: number
  ease: number
  extraX: number
  extraY: number
}

interface Props {
  items: LayerItem[]
}

/**
 * Build the base scatter in virtual space: a jittered grid (one tile per cell)
 * for reliable coverage, but loosened toward the reference's airy, organic feel.
 *
 * Two things matter with little content:
 *  - Density is kept low (≈2× the item count) so each item appears only a couple
 *    of times per pattern, well spaced — its true repeat then falls a full
 *    viewport away, at the tiling edges, not in close proximity.
 *  - Item→cell assignment is randomised but constrained so no cell shares its
 *    media with the cell to its left or above. That breaks the columnar
 *    stacking you get when the column count divides the item count.
 *
 * Large per-tile jitter + size variance keep the resting layout from reading as
 * a grid.
 */
function buildBase(items: LayerItem[]): BaseTile[] {
  const n = items.length
  if (n === 0) return []

  // Airy but gap-free density.
  const target = Math.min(24, Math.max(14, Math.round(n * 2.5)))
  const cols = Math.max(2, Math.round(Math.sqrt(target * (CW / CH))))
  const rows = Math.max(2, Math.ceil(target / cols))
  const cells = cols * rows
  const cellW = CW / cols
  const cellH = CH / rows

  // Assign media to cells from a *balanced* bag (every item used an equal number
  // of times), deterministically shuffled, then repaired so no cell shares its
  // media with any 4-neighbour. Balanced + de-clustered ⇒ repeats read as spread
  // out rather than stacked.
  const assign: number[] = Array.from({length: cells}, (_, k) => k % n)
  for (let k = cells - 1; k > 0; k--) {
    const j = Math.floor(rnd(k * 13 + 555) * (k + 1))
    ;[assign[k], assign[j]] = [assign[j], assign[k]]
  }
  const conflicts = (i: number, val: number) => {
    const c = i % cols
    const r = (i / cols) | 0
    return (
      (c > 0 && assign[i - 1] === val) ||
      (c < cols - 1 && assign[i + 1] === val) ||
      (r > 0 && assign[i - cols] === val) ||
      (r < rows - 1 && assign[i + cols] === val)
    )
  }
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < cells; i++) {
      if (!conflicts(i, assign[i])) continue
      for (let off = 1; off < cells; off++) {
        const j = (i + off) % cells
        if (
          assign[j] !== assign[i] &&
          !conflicts(i, assign[j]) &&
          !conflicts(j, assign[i])
        ) {
          ;[assign[i], assign[j]] = [assign[j], assign[i]]
          break
        }
      }
    }
  }

  const out: BaseTile[] = []
  let i = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const item = items[assign[i]]
      const ar = ASPECT[item.ratio]
      // Varied size; cap width so wide tiles don't dominate their cell. The
      // larger minimum lets neighbours overlap, covering jitter gaps.
      let h = cellH * (0.62 + rnd(i + 1) * 0.4) // 0.62–1.02 of the cell
      let w = h * ar
      const maxW = cellW * 1.1
      if (w > maxW) {
        w = maxW
        h = w / ar
      }
      // Jitter (±0.4 cell) for an organic, non-gridded rest state.
      const cx = (col + 0.5) * cellW + (rnd(i + 41) - 0.5) * cellW * 0.8
      const cy = (row + 0.5) * cellH + (rnd(i + 99) - 0.5) * cellH * 0.8
      out.push({item, x: cx - w / 2, y: cy - h / 2, w, h})
      i++
    }
  }
  return out
}

export function LayersGrid({items}: Props) {
  const reduce = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  // Rendered tiles (computed client-side from viewport + content).
  const [tiles, setTiles] = useState<
    Array<{key: string; item: LayerItem; w: number; h: number}>
  >([])

  // Per-tile physics + element refs, aligned by index with `tiles`.
  const physRef = useRef<PhysTile[]>([])
  const elRef = useRef<Array<HTMLDivElement | null>>([])
  const wrapRef = useRef<Array<HTMLDivElement | null>>([])
  const imgRef = useRef<Array<HTMLElement | null>>([])

  // Interaction state (mutable across frames).
  const stateRef = useRef({
    scroll: {
      cur: {x: 0, y: 0},
      target: {x: 0, y: 0},
      last: {x: 0, y: 0},
      delta: {cx: 0, cy: 0},
    },
    mouse: {tx: 0.5, ty: 0.5, cx: 0.5, cy: 0.5, pressT: 0, pressC: 0},
    drag: {active: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0},
    wrapX: 0,
    wrapY: 0,
  })
  const introDone = useRef(false)

  // ── Layout: (re)build tiles from viewport size + content ──────────────────
  useEffect(() => {
    if (reduce) return
    const base = buildBase(items)
    if (base.length === 0) return

    let raf = 0
    const build = () => {
      const winW = window.innerWidth
      const winH = window.innerHeight
      const k = winW / CW // uniform scale (scaleX === scaleY)
      const patternW = winW // == CW * k
      const patternH = CH * k

      // Replicate enough copies to always cover the viewport, then wrap by the
      // total pattern span so copies cycle seamlessly.
      const nx = Math.max(2, Math.ceil(winW / patternW) + 1)
      const ny = Math.max(2, Math.ceil(winH / patternH) + 1)

      const phys: PhysTile[] = []
      const rendered: Array<{key: string; item: LayerItem; w: number; h: number}> = []

      base.forEach((b, bi) => {
        const w = b.w * k
        const h = b.h * k
        for (let ix = 0; ix < nx; ix++) {
          for (let iy = 0; iy < ny; iy++) {
            phys.push({
              x: b.x * k + ix * patternW,
              y: b.y * k + iy * patternH,
              w,
              h,
              ease: ((bi * 7 + ix * 13 + iy * 29) % 100) / 200 + 0.5, // 0.5–1.0, stable
              extraX: 0,
              extraY: 0,
            })
            rendered.push({key: `${bi}-${ix}-${iy}`, item: b.item, w, h})
          }
        }
      })

      const s = stateRef.current
      s.wrapX = nx * patternW
      s.wrapY = ny * patternH
      // Start slightly offset so the seam isn't centred (matches reference).
      const ox = -winW * 0.1
      const oy = -winH * 0.1
      s.scroll.cur = {x: ox, y: oy}
      s.scroll.target = {x: ox, y: oy}
      s.scroll.last = {x: ox, y: oy}

      physRef.current = phys
      elRef.current = new Array(rendered.length).fill(null)
      wrapRef.current = new Array(rendered.length).fill(null)
      imgRef.current = new Array(rendered.length).fill(null)
      introDone.current = false
      setTiles(rendered)
    }

    build()
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(build)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [items, reduce])

  // ── Animation + interaction: runs once tiles (and their refs) are mounted ──
  useEffect(() => {
    if (reduce || tiles.length === 0) return
    const container = containerRef.current
    if (!container) return

    const s = stateRef.current

    // Intro: tiles currently on screen fly in from the viewport centre.
    if (!introDone.current) {
      introDone.current = true
      const winW = window.innerWidth
      const winH = window.innerHeight
      const visible: HTMLElement[] = []
      wrapRef.current.forEach((wrap, i) => {
        const el = elRef.current[i]
        if (!wrap || !el) return
        const p = physRef.current[i]
        const px = p.x + s.scroll.cur.x
        const py = p.y + s.scroll.cur.y
        if (px > -p.w && px < winW + p.w && py > -p.h && py < winH + p.h) {
          const tx = -px + winW * 0.5 - p.w * 0.5
          const ty = -py + winH * 0.5 - p.h * 0.5
          gsap.set(wrap, {x: tx, y: ty})
          visible.push(wrap)
        }
      })
      gsap.to(visible.reverse(), {
        duration: 2,
        ease: 'expo.inOut',
        x: 0,
        y: 0,
        stagger: 0.05,
      })
    }

    // ── Events ──────────────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      s.scroll.target.x -= e.deltaX * WHEEL_FACTOR
      s.scroll.target.y -= e.deltaY * WHEEL_FACTOR
    }
    const onPointerDown = (e: PointerEvent) => {
      s.drag.active = true
      s.mouse.pressT = 1
      s.drag.startX = e.clientX
      s.drag.startY = e.clientY
      s.drag.scrollX = s.scroll.target.x
      s.drag.scrollY = s.scroll.target.y
      document.documentElement.classList.add('grabbing')
    }
    const onPointerMove = (e: PointerEvent) => {
      s.mouse.tx = e.clientX / window.innerWidth
      s.mouse.ty = e.clientY / window.innerHeight
      if (s.drag.active) {
        s.scroll.target.x = s.drag.scrollX + (e.clientX - s.drag.startX)
        s.scroll.target.y = s.drag.scrollY + (e.clientY - s.drag.startY)
      }
    }
    const onPointerUp = () => {
      s.drag.active = false
      s.mouse.pressT = 0
      document.documentElement.classList.remove('grabbing')
    }

    container.addEventListener('wheel', onWheel, {passive: false})
    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // ── Render loop ───────────────────────────────────────────────────────────
    let raf = 0
    const tick = () => {
      const sc = s.scroll
      sc.cur.x += (sc.target.x - sc.cur.x) * SCROLL_EASE
      sc.cur.y += (sc.target.y - sc.cur.y) * SCROLL_EASE

      sc.delta.cx += (sc.cur.x - sc.last.x - sc.delta.cx) * DELTA_EASE
      sc.delta.cy += (sc.cur.y - sc.last.y - sc.delta.cy) * DELTA_EASE
      s.mouse.cx += (s.mouse.tx - s.mouse.cx) * MOUSE_EASE
      s.mouse.cy += (s.mouse.ty - s.mouse.cy) * MOUSE_EASE
      s.mouse.pressC += (s.mouse.pressT - s.mouse.pressC) * MOUSE_EASE

      const dirX = sc.cur.x > sc.last.x ? 1 : -1 // 1 = right
      const dirY = sc.cur.y > sc.last.y ? 1 : -1 // 1 = down
      const winW = window.innerWidth
      const winH = window.innerHeight

      const phys = physRef.current
      for (let i = 0; i < phys.length; i++) {
        const p = phys[i]
        const el = elRef.current[i]
        const img = imgRef.current[i]
        if (!el) continue

        const newX =
          DRIFT_GAIN * sc.delta.cx * p.ease + (s.mouse.cx - 0.5) * p.w * MOUSE_PARALLAX
        const newY =
          DRIFT_GAIN * sc.delta.cy * p.ease + (s.mouse.cy - 0.5) * p.h * MOUSE_PARALLAX

        let posX = p.x + sc.cur.x + p.extraX + newX
        let posY = p.y + sc.cur.y + p.extraY + newY

        if (dirX === 1 && posX > winW) p.extraX -= s.wrapX
        if (dirX === -1 && posX + p.w < 0) p.extraX += s.wrapX
        if (dirY === 1 && posY > winH) p.extraY -= s.wrapY
        if (dirY === -1 && posY + p.h < 0) p.extraY += s.wrapY

        posX = p.x + sc.cur.x + p.extraX + newX
        posY = p.y + sc.cur.y + p.extraY + newY
        el.style.transform = `translate(${posX}px, ${posY}px)`

        if (img) {
          const z = IMG_OVERSCALE + PRESS_ZOOM * s.mouse.pressC * p.ease
          const mx = -s.mouse.cx * p.ease * 10
          const my = -s.mouse.cy * p.ease * 10
          img.style.transform = `scale(${z}) translate(${mx}%, ${my}%)`
        }
      }

      sc.last.x = sc.cur.x
      sc.last.y = sc.cur.y
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Caption reveal as tiles enter view.
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => en.target.classList.toggle('lg-visible', en.isIntersecting)),
      {root: container, threshold: 0.05},
    )
    container.querySelectorAll('.lg-caption').forEach((c) => io.observe(c))

    return () => {
      cancelAnimationFrame(raf)
      container.removeEventListener('wheel', onWheel)
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      io.disconnect()
      document.documentElement.classList.remove('grabbing')
    }
  }, [tiles, reduce])

  // ── Reduced motion: a plain, accessible scrollable grid ───────────────────
  if (reduce) {
    return (
      <div className="px-3 pt-[110px] md:px-[30px]">
        <ul role="list" className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((item, i) => (
            <li key={i} className="flex flex-col gap-3">
              <div
                className="relative overflow-hidden rounded-[4px] md:rounded-[12px]"
                style={{aspectRatio: item.ratio, backgroundColor: item.color}}
              >
                <TileMedia item={item} />
              </div>
              <small className="text-xs leading-4 tracking-[-0.084px] text-text-secondary">
                {item.caption}
              </small>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Infinite gallery — drag or scroll to explore"
      className="fixed inset-0 h-[100dvh] w-full cursor-grab select-none overflow-hidden [html.grabbing_&]:cursor-grabbing"
      style={{touchAction: 'none'}}
    >
      {tiles.map((t, i) => (
        <div
          key={t.key}
          ref={(el) => {
            elRef.current[i] = el
          }}
          className="absolute left-0 top-0 will-change-transform"
          style={{width: t.w}}
        >
          <div
            ref={(el) => {
              wrapRef.current[i] = el
            }}
            className="will-change-transform"
          >
            <div
              className="relative overflow-hidden rounded-[4px] md:rounded-[12px]"
              style={{width: t.w, height: t.h, backgroundColor: t.item.color}}
            >
              <TileMedia
                item={t.item}
                mediaRef={(el) => {
                  imgRef.current[i] = el
                }}
              />
            </div>
            <small className="lg-caption mt-3 block max-w-full overflow-hidden text-[11px] leading-[1.3] tracking-[-0.084px] text-text-secondary md:text-xs">
              <span className="lg-caption-inner block">{t.item.caption}</span>
            </small>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Tile media — image wins over video (matching the schema rule). The element is
 * over-scaled and ref'd so the loop can apply the cursor-parallax transform.
 */
function TileMedia({
  item,
  mediaRef,
}: {
  item: LayerItem
  mediaRef?: (el: HTMLElement | null) => void
}) {
  const common =
    'absolute inset-0 h-full w-full object-cover will-change-transform'
  if (item.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={mediaRef as (el: HTMLImageElement | null) => void}
        src={urlForImage(item.image).width(1200).auto('format').url()}
        alt={item.image.alt ?? item.caption}
        draggable={false}
        className={common}
        style={{transform: `scale(${IMG_OVERSCALE})`}}
      />
    )
  }
  if (item.videoUrl) {
    return (
      <video
        ref={mediaRef as (el: HTMLVideoElement | null) => void}
        src={item.videoUrl}
        poster={item.poster ? urlForImage(item.poster).width(1200).auto('format').url() : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={item.caption}
        className={common}
        style={{transform: `scale(${IMG_OVERSCALE})`}}
      />
    )
  }
  return null
}
