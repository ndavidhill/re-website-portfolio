import Image from 'next/image'
import {urlForImage, type CaseStudyBlock, type SanityImage} from '@/lib/sanity'
import {Reveal} from '@/components/Reveal'
import {VimeoBlock} from '@/app/_components/VimeoBlock'

function imgSrc(image: SanityImage, width: number) {
  return urlForImage(image).width(width).auto('format').url()
}

function MediaBlockView({
  block,
  priority = false,
}: {
  block: Extract<CaseStudyBlock, {_type: 'mediaBlock'}>
  priority?: boolean
}) {
  const images = block.images ?? []
  if (images.length === 0) return null

  if (block.layout === 'pair' && images.length === 2) {
    return (
      <figure className="flex w-full flex-col gap-2">
        <div className="flex w-full items-stretch gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] flex-1 overflow-hidden rounded-[25px]"
            >
              <Image
                src={imgSrc(img, 1200)}
                alt={img.alt ?? ''}
                fill
                sizes="(min-width: 1280px) 50vw, 100vw"
                className="object-cover"
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

  const img = images[0]
  return (
    <figure className="relative w-full">
      <div
        className={
          'relative w-full overflow-hidden rounded-[15px] ' +
          (block.layout === 'full' ? 'aspect-[16/9]' : 'aspect-[1320/851]')
        }
      >
        <Image
          src={imgSrc(img, 2000)}
          alt={img.alt ?? ''}
          fill
          sizes="100vw"
          className="object-cover"
          priority={priority}
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

function VideoBlockView({
  block,
}: {
  block: Extract<CaseStudyBlock, {_type: 'videoBlock'}>
}) {
  if (!block.url) return null
  return (
    <VimeoBlock
      url={block.url}
      caption={block.caption}
      audioControl={block.audioControl}
      aspectRatio={block.aspectRatio}
    />
  )
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
      {block.images.map((img, i) => (
        <div
          key={i}
          className="relative aspect-square overflow-hidden rounded-[15px]"
        >
          <Image
            src={imgSrc(img, 900)}
            alt={img.alt ?? ''}
            fill
            sizes="(min-width: 768px) 33vw, 50vw"
            className="object-cover"
            priority={priority && i === 0}
          />
        </div>
      ))}
    </div>
  )
}

function QuoteBlockView({
  block,
}: {
  block: Extract<CaseStudyBlock, {_type: 'quoteBlock'}>
}) {
  if (!block.quote) return null
  return (
    <blockquote className="border-t border-border pt-8">
      <p className="text-[40px] font-medium leading-[44px] tracking-[-0.6px] text-text-primary">
        “{block.quote}”
      </p>
      {(block.attribution || block.role) && (
        <footer className="mt-6 text-base leading-5 tracking-[-0.176px] text-text-secondary">
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
          <dt className="text-[56px] font-medium leading-[56px] tracking-[-0.56px] text-text-primary">
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
      <h2 className="mx-auto max-w-[760px] text-[40px] font-medium leading-[44px] tracking-[-0.6px] text-text-primary">
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
