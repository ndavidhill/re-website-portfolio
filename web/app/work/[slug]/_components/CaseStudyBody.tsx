import Image from 'next/image'
import {
  urlForImage,
  type CaseStudyBlock,
  type SanityImage,
  type PairVideo,
} from '@/lib/sanity'
import {Reveal} from '@/components/Reveal'
import {ProgressiveBlur} from '@/components/ProgressiveBlur'
import {BlurredCoverVideo} from '@/components/BlurredCoverVideo'
import {VimeoBlock} from '@/app/_components/VimeoBlock'
import {LazyCoverVideo} from '@/app/_components/LazyCoverVideo'

function imgSrc(image: SanityImage, width: number) {
  return urlForImage(image).width(width).auto('format').url()
}

function isPairVideo(item: SanityImage | PairVideo): item is PairVideo {
  return item._type === 'pairVideo'
}

// Frames holding an <iframe> need their own compositing layer so the embed
// clips against the rounded corners (Chromium/WebKit don't do this otherwise).
const FRAME_FX =
  'overflow-hidden rounded-[4px] md:rounded-[16px] [transform:translateZ(0)] [isolation:isolate]'

/**
 * One slot in a media block — an image or a video — rendered to fully cover
 * its (positioned) frame. MP4s use object-cover; Vimeo/YouTube use the
 * background embed, which covers its iframe.
 */
function MediaSlot({
  item,
  width,
  sizes,
  priority = false,
}: {
  item: SanityImage | PairVideo
  width: number
  sizes: string
  priority?: boolean
}) {
  if (!isPairVideo(item)) {
    const src = imgSrc(item, width)
    return (
      <>
        <Image
          src={src}
          alt={item.alt ?? ''}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
        <ProgressiveBlur imageSrc={src} />
      </>
    )
  }

  const posterSrc = item.poster
    ? urlForImage(item.poster).width(1600).url()
    : item.posterUrl

  // Self-hosted MP4s get the WebGL progressive blur (their frames can be
  // textured); third-party embeds can't be sampled, so they stay sharp.
  // Both are viewport-gated so stacked/paired clips don't all load at once.
  const fileUrl = item.videoFile?.asset?.url
  if (fileUrl) {
    return <BlurredCoverVideo fileUrl={fileUrl} poster={posterSrc} title={item.alt} />
  }

  return <LazyCoverVideo url={item.url} poster={posterSrc} title={item.alt} />
}

function MediaBlockView({
  block,
  priority = false,
}: {
  block: Extract<CaseStudyBlock, {_type: 'mediaBlock'}>
  priority?: boolean
}) {
  const items = block.images ?? []
  if (items.length === 0) return null

  if (block.layout === 'pair' && items.length === 2) {
    const ratio = parseRatio(block.aspectRatio) ?? '4 / 5'
    return (
      <figure className="flex w-full flex-col gap-2">
        <div className="flex w-full items-stretch gap-2">
          {items.map((item, i) => (
            <div
              key={i}
              className={`relative flex-1 ${FRAME_FX}`}
              style={{aspectRatio: ratio}}
            >
              <MediaSlot
                item={item}
                width={1200}
                sizes="(min-width: 1280px) 50vw, 100vw"
                priority={priority && i === 0}
              />
            </div>
          ))}
        </div>
        {block.caption && (
          <figcaption className="text-sm leading-[22px] text-text-secondary">
            {block.caption}
          </figcaption>
        )}
      </figure>
    )
  }

  // Full bleed: render at full width, height proportional to the upload (its
  // intrinsic aspect ratio — no crop). Contained: a fixed frame the image fills
  // (cover). Falls back to 16/9 if the asset's dimensions aren't available.
  const isFull = block.layout === 'full'
  const first = items[0]
  const naturalAspect = !isPairVideo(first)
    ? first.asset?.metadata?.dimensions?.aspectRatio
    : undefined

  return (
    <figure className="relative w-full">
      <div
        className={`relative w-full ${FRAME_FX}${isFull ? '' : ' aspect-[1320/851]'}`}
        style={isFull ? {aspectRatio: naturalAspect ?? 16 / 9} : undefined}
      >
        <MediaSlot item={items[0]} width={2000} sizes="100vw" priority={priority} />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-sm leading-[22px] text-text-secondary">
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}

function VideoBlockView({
  block,
}: {
  block: Extract<CaseStudyBlock, {_type: 'videoBlock'}>
}) {
  // Self-hosted file takes precedence (migrated full-width videos). Autoplays
  // muted + loops, controls hidden — same treatment as the homepage hero.
  const fileUrl = block.videoFile?.asset?.url
  if (fileUrl) {
    const ratio = parseRatio(block.aspectRatio)
    return (
      <figure className="w-full">
        <div
          className="relative w-full overflow-hidden rounded-[4px] bg-canvas md:rounded-[16px]"
          style={ratio ? {aspectRatio: ratio} : undefined}
        >
          <video
            src={fileUrl}
            poster={
              block.poster ? urlForImage(block.poster).width(1600).url() : undefined
            }
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className={ratio ? 'absolute inset-0 h-full w-full object-cover' : 'block h-auto w-full'}
          />
        </div>
        {block.caption && (
          <figcaption className="mt-2 text-sm leading-[22px] text-text-secondary">
            {block.caption}
          </figcaption>
        )}
      </figure>
    )
  }

  if (!block.url) return null
  return (
    <VimeoBlock
      url={block.url}
      caption={block.caption}
      audioControl={block.audioControl}
      aspectRatio={block.aspectRatio}
      poster={
        block.poster
          ? urlForImage(block.poster).width(1600).url()
          : block.posterUrl
      }
    />
  )
}

/** "16/9" | "16:9" | "1.78" → CSS aspect-ratio string, or null. */
function parseRatio(v?: string): string | null {
  if (!v) return null
  const c = v.trim().replace(':', '/').replace(/\s+/g, '')
  if (/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/.test(c)) return c.replace('/', ' / ')
  if (/^\d+(?:\.\d+)?$/.test(c)) return c
  return null
}

function GalleryBlockView({
  block,
  priority = false,
}: {
  block: Extract<CaseStudyBlock, {_type: 'galleryBlock'}>
  priority?: boolean
}) {
  const columns = block.columns ?? 3
  const gridCls =
    columns === 2
      ? 'grid-cols-2'
      : columns === 4
      ? 'grid-cols-2 md:grid-cols-4'
      : 'grid-cols-2 md:grid-cols-3'
  return (
    <div className={`grid w-full gap-4 ${gridCls}`}>
      {block.images.map((img, i) => {
        const src = imgSrc(img, 900)
        return (
          <div
            key={i}
            className="relative aspect-square overflow-hidden rounded-[4px] md:rounded-[16px]"
          >
            <Image
              src={src}
              alt={img.alt ?? ''}
              fill
              sizes="(min-width: 768px) 33vw, 50vw"
              className="object-cover"
              priority={priority && i === 0}
            />
            <ProgressiveBlur imageSrc={src} />
          </div>
        )
      })}
    </div>
  )
}

function QuoteBlockView({
  block,
}: {
  block: Extract<CaseStudyBlock, {_type: 'quoteBlock'}>
}) {
  if (!block.quote) return null
  // Compact surface card matching the Accordion rows (rounded-md bg-surface,
  // 14px copy), constrained to a single column rather than full-bleed.
  return (
    <blockquote className="max-w-[550px] rounded-md bg-surface p-3.5">
      <p className="text-[14px] font-medium leading-5 tracking-[-0.084px] text-text-primary">
        “{block.quote}”
      </p>
      {(block.attribution || block.role) && (
        <footer className="mt-2.5 text-[14px] leading-5 tracking-[-0.084px] text-text-secondary">
          {block.attribution}
          {block.attribution && block.role && ' · '}
          {block.role}
        </footer>
      )}
    </blockquote>
  )
}

function StatsBlockView({
  block,
}: {
  block: Extract<CaseStudyBlock, {_type: 'statsBlock'}>
}) {
  return (
    <dl
      className="grid w-full gap-4 border-t border-border pt-8"
      style={{gridTemplateColumns: `repeat(${block.stats.length}, minmax(0, 1fr))`}}
    >
      {block.stats.map((s) => (
        <div key={s._key} className="flex flex-col gap-2">
          <dt className="text-[40px] font-medium leading-[40px] tracking-[-0.4px] text-text-primary md:text-[56px] md:leading-[56px] md:tracking-[-0.56px]">
            {s.value}
          </dt>
          <dd className="text-base leading-5 text-text-secondary">{s.label}</dd>
        </div>
      ))}
    </dl>
  )
}

function PortableTextView({
  block,
}: {
  block: Extract<CaseStudyBlock, {_type: 'block'}>
}) {
  const text = block.children
    .map((c) => {
      let out = c.text
      if (c.marks?.includes('strong')) out = `**${out}**`
      if (c.marks?.includes('em')) out = `*${out}*`
      return out
    })
    .join('')

  if (block.style === 'h2') {
    return (
      <h2 className="mx-auto max-w-[760px] text-[28px] font-medium leading-[32px] tracking-[-0.4px] md:text-[40px] md:leading-[44px] md:tracking-[-0.6px] text-text-primary">
        {text}
      </h2>
    )
  }
  if (block.style === 'h3') {
    return (
      <h3 className="mx-auto max-w-[760px] text-2xl font-medium leading-[28px] tracking-[-0.4px] text-text-primary">
        {text}
      </h3>
    )
  }
  if (block.listItem === 'bullet') {
    return (
      <li className="mx-auto max-w-[760px] list-disc text-lg leading-[28px] text-text-secondary marker:text-text-faint">
        {text}
      </li>
    )
  }
  return (
    <p className="mx-auto max-w-[760px] text-lg leading-[28px] tracking-[-0.2px] text-text-secondary">
      {text}
    </p>
  )
}

export function CaseStudyBody({blocks}: {blocks: CaseStudyBlock[]}) {
  // First image-bearing block gets priority loading so it can serve as the
  // LCP candidate. Text/quote/stats blocks don't take the slot.
  const firstImageIdx = blocks.findIndex(
    (b) => b._type === 'mediaBlock' || b._type === 'galleryBlock',
  )

  return (
    <div className="flex w-full flex-col gap-4">
      {blocks.map((block, i) => {
        const rendered = (() => {
          switch (block._type) {
            case 'mediaBlock':
              return (
                <MediaBlockView block={block} priority={i === firstImageIdx} />
              )
            case 'videoBlock':
              return <VideoBlockView block={block} />
            case 'galleryBlock':
              return (
                <GalleryBlockView
                  block={block}
                  priority={i === firstImageIdx}
                />
              )
            case 'quoteBlock':
              return <QuoteBlockView block={block} />
            case 'statsBlock':
              return <StatsBlockView block={block} />
            case 'block':
              return <PortableTextView block={block} />
            default:
              return null
          }
        })()

        if (rendered === null) return null
        return (
          <Reveal key={block._key} className="w-full">
            {rendered}
          </Reveal>
        )
      })}
    </div>
  )
}
