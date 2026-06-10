import type {Metadata} from 'next'
import {SiteHeader} from '@/components/SiteHeader'
import {getPlayItems, type PlayItem} from '@/lib/sanity'
import {LayersGrid, type LayerItem} from './_components/LayersGrid'

export const metadata: Metadata = {
  title: 'Play',
  description: 'Studio experiments, sketches and side studies from re.design.',
}

// Muted placeholder palette — shows through tiles with no media so empty
// entries still read as intentional. Cycled per item.
const PLACEHOLDER_PALETTE = [
  '#D6CFC1',
  '#7B8B7E',
  '#5C6F7E',
  '#A0A8A0',
  '#8B5C5C',
  '#736857',
  '#C9A671',
  '#5E5E68',
  '#3E4E58',
  '#B8B8B0',
] as const

// Fallback so the canvas is never empty before any playItems are published.
const FALLBACK: LayerItem[] = [
  {caption: 'Type study — 2026', ratio: '4/5', color: '#D6CFC1'},
  {caption: 'Colour experiment — 2026', ratio: '1/1', color: '#7B8B7E'},
  {caption: 'Motion sketch — 2026', ratio: '16/9', color: '#5C6F7E'},
  {caption: 'Material study — 2025', ratio: '4/5', color: '#A0A8A0'},
  {caption: 'Pattern system — 2025', ratio: '1/1', color: '#8B5C5C'},
  {caption: 'Type & space — 2025', ratio: '16/9', color: '#736857'},
  {caption: 'Mark exploration — 2025', ratio: '1/1', color: '#C9A671'},
  {caption: 'Surface texture — 2024', ratio: '16/9', color: '#5E5E68'},
]

function toLayerItem(item: PlayItem, color: string): LayerItem {
  return {
    caption: item.title,
    ratio: item.aspectRatio,
    color,
    image: item.image,
    videoUrl: item.videoFile?.asset?.url,
    poster: item.poster,
  }
}

export default async function PlayPage() {
  // Rows are irrelevant on a 2D canvas — flatten the whole pool.
  const items = await getPlayItems()
  const layers: LayerItem[] =
    items.length > 0
      ? items.map((it, i) =>
          toLayerItem(it, PLACEHOLDER_PALETTE[i % PLACEHOLDER_PALETTE.length]),
        )
      : FALLBACK

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-canvas text-text-primary">
      <SiteHeader activeHref="/play" />

      {/* Subtle top scrim so the nav stays legible over imagery (the page
          doesn't scroll, so the header's own backdrop never engages). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[140px] bg-gradient-to-b from-canvas/80 to-transparent"
      />

      <LayersGrid items={layers} />

      {/* Hint */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between px-3 pb-5 md:px-[30px]">
        <span className="text-[11px] uppercase tracking-[0.4px] text-text-faint md:text-xs">
          Drag · scroll to explore
        </span>
      </div>
    </main>
  )
}
