import type {Metadata} from 'next'
import {SiteHeader} from '@/components/SiteHeader'
import {ContactAndFooter} from '@/components/ContactAndFooter'
import {AnimatedHeading} from '@/components/AnimatedHeading'
import {type} from '@/lib/design'
import {InfiniteGallery, type GalleryItem} from './_components/InfiniteGallery'

export const metadata: Metadata = {
  title: 'Play',
  description: 'Studio experiments, sketches and side studies from re.design.',
}

// Placeholder tiles until the real Play CMS schema lands. Captions are
// intentionally generic and colours are drawn from a muted palette that reads
// as placeholder on both themes (so they don't look like finished work).
const ITEMS: GalleryItem[] = [
  {caption: 'Type study — 2026', ratio: '4/5', color: '#D6CFC1'},
  {caption: 'Colour experiment — 2026', ratio: '1/1', color: '#7B8B7E'},
  {caption: 'Motion sketch — 2026', ratio: '16/9', color: '#5C6F7E'},
  {caption: 'Material study — 2025', ratio: '4/5', color: '#A0A8A0'},
  {caption: 'Pattern system — 2025', ratio: '1/1', color: '#8B5C5C'},
  {caption: 'Type & space — 2025', ratio: '16/9', color: '#736857'},
  {caption: 'Mark exploration — 2025', ratio: '4/5', color: '#C9A671'},
  {caption: 'Surface texture — 2024', ratio: '1/1', color: '#5E5E68'},
  {caption: 'Layout study — 2024', ratio: '16/9', color: '#3E4E58'},
  {caption: 'Print mock — 2024', ratio: '4/5', color: '#B8B8B0'},
]

export default function PlayPage() {
  return (
    <main className="relative w-full bg-canvas text-text-primary">
      <SiteHeader activeHref="/play" />

      <div className="flex w-full flex-col gap-12 pb-5 pt-[88px] md:gap-[80px] md:pt-[110px]">
        <header className="flex flex-col gap-3 border-t border-border px-6 pt-5 md:px-[60px]">
          <AnimatedHeading
            text="Play"
            as="h1"
            className={`${type.h1} text-text-primary`}
          />
          <p
            className={`max-w-[550px] text-text-secondary ${type.body}`}
          >
            Sketches, experiments and side studies. Scroll, drag, or just watch
            it drift.
          </p>
        </header>

        <InfiniteGallery items={ITEMS} />

        <div className="px-6 md:px-[60px]">
          <ContactAndFooter />
        </div>
      </div>
    </main>
  )
}
