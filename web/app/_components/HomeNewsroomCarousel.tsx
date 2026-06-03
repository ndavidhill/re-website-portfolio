'use client'

import Image from 'next/image'
import Link from 'next/link'
import {motion, useReducedMotion} from 'framer-motion'
import {useCallback, useEffect, useRef, useState} from 'react'
import {urlForImage, type ArticleCard} from '@/lib/sanity'

interface Props {
  articles: ArticleCard[]
}

const CARD_WIDTH = 408
const GAP = 24

export function HomeNewsroomCarousel({articles}: Props) {
  const prefersReduced = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  const recomputeProgress = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    setProgress(max > 0 ? track.scrollLeft / max : 0)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    recomputeProgress()
    track.addEventListener('scroll', recomputeProgress, {passive: true})
    window.addEventListener('resize', recomputeProgress)
    return () => {
      track.removeEventListener('scroll', recomputeProgress)
      window.removeEventListener('resize', recomputeProgress)
    }
  }, [recomputeProgress])

  const scrollBy = (delta: number) => {
    trackRef.current?.scrollBy({
      left: delta,
      behavior: prefersReduced ? 'auto' : 'smooth',
    })
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-[4px] border border-border bg-surface px-8 py-16 text-center text-text-secondary md:rounded-[20px]">
        No articles yet — publish from the Studio to populate this carousel.
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-(CARD_WIDTH + GAP))}
          aria-label="Previous"
          className="flex h-9 items-center rounded-lg border border-border bg-canvas px-3 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => scrollBy(CARD_WIDTH + GAP)}
          aria-label="Next"
          className="flex h-9 items-center rounded-lg border border-border bg-canvas px-3 text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
        >
          Next →
        </button>
        <Link
          href="/think"
          className="ml-auto text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          See all
        </Link>
      </div>

      <div
        ref={trackRef}
        className="-mx-3 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-3 pb-2 md:-mx-[30px] md:px-[30px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {articles.map((article) => (
          <NewsCard key={article._id} article={article} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mx-auto h-[9px] w-[1110px] max-w-full rounded-full bg-border">
        <motion.div
          className="h-full rounded-full bg-text-secondary"
          style={{width: `${Math.max(8, progress * 100)}%`}}
          animate={{width: `${Math.max(8, progress * 100)}%`}}
          transition={{duration: 0.2, ease: 'easeOut'}}
        />
      </div>
    </div>
  )
}

function NewsCard({article}: {article: ArticleCard}) {
  const src = article.coverImage
    ? urlForImage(article.coverImage).width(900).auto('format').url()
    : null
  const year = article.publishedAt
    ? new Date(article.publishedAt).getFullYear()
    : ''
  return (
    <Link
      href={`/think/${article.slug}`}
      className="group flex w-[78vw] max-w-[360px] shrink-0 snap-start flex-col overflow-hidden rounded-[4px] bg-surface md:w-[408px] md:max-w-none md:rounded-[20px]"
    >
      <div className="relative aspect-[408/571] w-full overflow-hidden">
        {src ? (
          <Image
            src={src}
            alt={article.coverImage?.alt ?? article.title}
            fill
            sizes="408px"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-faint">
            <span className="text-sm">No image</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2 px-4 py-3 text-[14px] leading-[14px] tracking-[-0.2px]">
        <span className="text-text-primary line-clamp-1">{article.title}</span>
        <span className="text-text-faint">{year}</span>
      </div>
    </Link>
  )
}
