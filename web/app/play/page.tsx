import type {Metadata} from 'next'
import {SiteHeader} from '@/components/SiteHeader'
import {ContactAndFooter} from '@/components/ContactAndFooter'
import {getPlayItems, type PlayItem} from '@/lib/sanity'
import {InfiniteGallery, type GalleryItem} from './_components/InfiniteGallery'

export const metadata: Metadata = {
  title: 'Play',
  description: 'Studio experiments, sketches and side studies from re.design.',
}

// Muted placeholder palette — assigned by index so empty Sanity entries (no
// image / no video) still read as intentional placeholder tiles instead of
// blank rectangles. Cycled per row.
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

// Fallback items so the page is non-empty before any playItems exist in
// Sanity. Once the editor publishes items they win — these only appear when
// a row is empty.
const FALLBACK_ROW_1: GalleryItem[] = [
  {caption: 'Type study — 2026', ratio: '4/5', color: '#D6CFC1'},
  {caption: 'Colour experiment — 2026', ratio: '1/1', color: '#7B8B7E'},
  {caption: 'Motion sketch — 2026', ratio: '16/9', color: '#5C6F7E'},
  {caption: 'Material study — 2025', ratio: '4/5', color: '#A0A8A0'},
  {caption: 'Pattern system — 2025', ratio: '1/1', color: '#8B5C5C'},
  {caption: 'Type & space — 2025', ratio: '16/9', color: '#736857'},
]

const FALLBACK_ROW_2: GalleryItem[] = [
  {caption: 'Mark exploration — 2025', ratio: '1/1', color: '#C9A671'},
  {caption: 'Surface texture — 2024', ratio: '16/9', color: '#5E5E68'},
  {caption: 'Layout study — 2024', ratio: '4/5', color: '#3E4E58'},
  {caption: 'Print mock — 2024', ratio: '1/1', color: '#B8B8B0'},
  {caption: 'Generative pattern — 2024', ratio: '16/9', color: '#7B8B7E'},
  {caption: 'Stencil study — 2023', ratio: '4/5', color: '#8B5C5C'},
]

function toGalleryItem(item: PlayItem, fallbackColor: string): GalleryItem {
  return {
    caption: item.title,
    ratio: item.aspectRatio,
    color: fallbackColor,
    image: item.image,
    videoUrl: item.videoFile?.asset?.url,
    poster: item.poster,
  }
}

function splitByRow(items: PlayItem[]) {
  const map = (rowItems: PlayItem[]): GalleryItem[] =>
    rowItems.map((item, idx) =>
      toGalleryItem(item, PLACEHOLDER_PALETTE[idx % PLACEHOLDER_PALETTE.length]),
    )
  return {
    row1: map(items.filter((i) => i.row === 1)),
    row2: map(items.filter((i) => i.row === 2)),
  }
}

export default async function PlayPage() {
  const items = await getPlayItems()
  const {row1, row2} = splitByRow(items)

  // Show fallback placeholders for rows the editor hasn't populated yet, so
  // the layout is never half-empty.
  const top = row1.length > 0 ? row1 : FALLBACK_ROW_1
  const bottom = row2.length > 0 ? row2 : FALLBACK_ROW_2

  return (
    <main className="relative w-full bg-canvas text-text-primary">
      <SiteHeader activeHref="/play" />

      <div className="flex w-full flex-col gap-8 pb-5 pt-[88px] md:gap-12 md:pt-[110px]">
        {/* Top row drifts right-to-left (direction = +1). */}
        <InfiniteGallery items={top} direction={1} />
        {/* Bottom row drifts the opposite way for visual counterpoint. */}
        <InfiniteGallery items={bottom} direction={-1} />

        <div className="px-3 md:px-[30px]">
          <ContactAndFooter />
        </div>
      </div>
    </main>
  )
}
