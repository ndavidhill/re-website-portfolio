import {createClient, type QueryParams} from 'next-sanity'
import {createImageUrlBuilder} from '@sanity/image-url'
import {groq} from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2025-05-01'

// Project isn't provisioned until the user runs `npx sanity init --bare` and
// drops the resulting ids into .env.local. Until then, fetchers return empty
// results instead of throwing so `next build` and dev server stay usable.
const hasProject = Boolean(projectId)

export const client = hasProject
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: process.env.NODE_ENV === 'production',
    })
  : null

const builder = hasProject && client ? createImageUrlBuilder(client) : null

export function urlForImage(source: SanityImageSource) {
  if (!builder) {
    throw new Error(
      'Sanity image URL requested but NEXT_PUBLIC_SANITY_PROJECT_ID is unset.',
    )
  }
  return builder.image(source)
}

export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {},
  tags: string[] = [],
): Promise<T | null> {
  if (!client) return null
  return client.fetch<T>(query, params, {
    next: {revalidate: 60, tags},
  })
}

// ---------------------------------------------------------------------------
// Types — hand-written to match /studio/schemas. Replace with `sanity-codegen`
// output (see web/sanity-codegen.config.ts) once a Sanity project is live.
// ---------------------------------------------------------------------------

export type SanityImageSource = {
  asset?: {_ref: string; _type: 'reference'}
  hotspot?: unknown
  crop?: unknown
}

export interface SanityImage {
  _type: 'image'
  asset: {_ref: string; _type: 'reference'}
  alt?: string
  hotspot?: {x: number; y: number; height: number; width: number}
  crop?: {top: number; bottom: number; left: number; right: number}
}

/**
 * Image with asset metadata dereferenced — used by the justified-gallery Work
 * index where we need each image's aspect ratio at render time. The asset's
 * `_ref` is also still useful for image URL building via urlForImage.
 */
export interface SanityImageWithDimensions {
  _type: 'image'
  _key?: string
  alt?: string
  asset: {
    _id: string
    _ref: string
    _type: 'reference'
    metadata?: {
      dimensions?: {
        aspectRatio: number
        width: number
        height: number
      }
    }
  }
  hotspot?: {x: number; y: number; height: number; width: number}
  crop?: {top: number; bottom: number; left: number; right: number}
}

/**
 * Video item inside the Work index grid. The editor uploads a file directly
 * to Sanity and specifies an aspect ratio (Sanity doesn't read video
 * dimensions automatically the way it does for images).
 */
export interface GridVideo {
  _type: 'gridVideo'
  _key: string
  alt?: string
  aspectRatio: string
  file?: {
    asset?: {
      _id: string
      url?: string
      mimeType?: string
    }
  }
  poster?: SanityImage
}

/** A grid item can be an image OR a video. Discriminated by `_type`. */
export type GridMediaItem = SanityImageWithDimensions | GridVideo

export type Discipline =
  | 'brand-identity'
  | 'strategy'
  | 'digital-product'
  | 'website'
  | 'campaign'
  | 'packaging'
  | 'motion'
  | 'editorial'
  | 'spatial'
  | 'service-design'

export interface ProjectCredit {
  _key: string
  role?: string
  people?: string
}

/**
 * A video slot inside a media pair. Mirrors videoBlock: a Vimeo/YouTube URL
 * for embeds, or a self-hosted file that takes precedence over the URL.
 */
export interface PairVideo {
  _type: 'pairVideo'
  _key: string
  url?: string
  videoFile?: {asset?: {url?: string; mimeType?: string}}
  poster?: SanityImage
  alt?: string
  /** Derived (not from Sanity): Vimeo thumbnail used as a poster fallback. */
  posterUrl?: string
}

export interface MediaBlock {
  _type: 'mediaBlock'
  _key: string
  layout: 'full' | 'contained' | 'pair'
  /** Each item is an image or, in the pair layout, a video. */
  images?: (SanityImage | PairVideo)[]
  /** Pair layout only: frame ratio for both columns, e.g. "4/5", "9/16". */
  aspectRatio?: string
  caption?: string
}

export interface QuoteBlock {
  _type: 'quoteBlock'
  _key: string
  quote?: string
  attribution?: string
  role?: string
}

export interface StatsBlock {
  _type: 'statsBlock'
  _key: string
  stats: {_key: string; value?: string; label?: string}[]
}

export interface GalleryBlock {
  _type: 'galleryBlock'
  _key: string
  images: SanityImage[]
  columns?: 2 | 3 | 4
}

export interface VideoBlock {
  _type: 'videoBlock'
  _key: string
  url?: string
  /** Self-hosted video file (takes precedence over url). */
  videoFile?: {asset?: {url?: string; mimeType?: string}}
  poster?: SanityImage
  caption?: string
  audioControl?: boolean
  /** Optional aspect ratio override, e.g. "16/9" or "9/16". */
  aspectRatio?: string
  /** Derived (not from Sanity): Vimeo thumbnail used as a poster fallback. */
  posterUrl?: string
}

export interface PortableTextBlock {
  _type: 'block'
  _key: string
  style?: 'normal' | 'h2' | 'h3'
  listItem?: 'bullet'
  children: {
    _type: 'span'
    _key: string
    text: string
    marks?: string[]
  }[]
  markDefs?: {
    _key: string
    _type: 'link'
    href: string
    newTab?: boolean
  }[]
}

export type CaseStudyBlock =
  | PortableTextBlock
  | MediaBlock
  | QuoteBlock
  | StatsBlock
  | GalleryBlock
  | VideoBlock

export interface DescriptionAccordionItem {
  _key: string
  title: string
  body?: string
}

export interface CaseStudy {
  _id: string
  _type: 'caseStudy'
  title: string
  slug: {current: string}
  client: string
  year: number
  summary: string
  tagline?: string
  descriptionAccordion?: DescriptionAccordionItem[]
  disciplines?: Discipline[]
  heroImage: SanityImage
  thumbnailImage?: SanityImage
  gridImages?: GridMediaItem[]
  featured?: boolean
  order?: number
  body?: CaseStudyBlock[]
  credits?: ProjectCredit[]
  externalUrl?: string
  seoTitle?: string
  seoDescription?: string
}

export interface CaseStudyCard {
  _id: string
  title: string
  slug: string
  client: string
  year: number
  summary: string
  tagline?: string
  disciplines?: Discipline[]
  thumbnailImage?: SanityImageWithDimensions
  gridImages?: GridMediaItem[]
  featured?: boolean
  isNew?: boolean
}

export interface ClientRef {
  _id: string
  name: string
  url?: string
}

export interface HomeQuestion {
  _key: string
  label: string
  body: string
}

export interface HomeWorkIntroBlock {
  _key: string
  heading: string
  body: string
  /** Up to three images, rendered in a row below the body. */
  images?: SanityImage[]
}

export interface HomeAward {
  _key: string
  description: string
  award?: string
  year?: number
}

export interface HomePage {
  _id: string
  heroVideoUrl: string
  heroVideoPoster?: SanityImage
  introParagraph: string
  newBusinessEmail?: string
  careersEmail?: string
  capabilities?: string[]
  questions?: HomeQuestion[]
  clients?: ClientRef[]
  workIntroBlocks?: HomeWorkIntroBlock[]
  newsroomIntro?: string
  awardsHeading?: string
  awards?: HomeAward[]
  seoTitle?: string
  seoDescription?: string
}

export interface ArticleCard {
  _id: string
  title: string
  slug: string
  excerpt?: string
  publishedAt: string
  coverImage?: SanityImage
  tags?: string[]
}

/**
 * A single tile in the /play infinite gallery. Either `image` or `videoFile`
 * is set (image wins if both are present). `row` (1 or 2) picks which of the
 * two opposite-drift rows it appears in.
 */
export interface PlayItem {
  _id: string
  title: string
  row: 1 | 2
  order?: number
  aspectRatio: '4/5' | '1/1' | '16/9'
  image?: SanityImage
  videoFile?: {asset?: {url?: string; mimeType?: string}}
  poster?: SanityImage
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const caseStudyBySlugQuery = groq`
  *[_type == "caseStudy" && slug.current == $slug][0]{
    _id,
    _type,
    title,
    slug,
    client,
    year,
    summary,
    tagline,
    descriptionAccordion[]{_key, title, body},
    disciplines,
    heroImage{..., asset->},
    thumbnailImage{..., asset->},
    gridImages[]{
      ...,
      _type == "image" => {
        alt,
        asset->{_id, metadata{dimensions{aspectRatio, width, height}}}
      },
      _type == "gridVideo" => {
        alt,
        aspectRatio,
        file{asset->{_id, url, mimeType}},
        poster{..., asset->}
      }
    },
    featured,
    order,
    body[]{
      ...,
      _type == "mediaBlock" => {
        ...,
        images[]{
          ...,
          asset->,
          _type == "pairVideo" => {
            ...,
            poster{..., asset->},
            videoFile{asset->{url, mimeType}}
          }
        }
      },
      _type == "galleryBlock" => {
        ...,
        images[]{..., asset->}
      },
      _type == "videoBlock" => {
        ...,
        poster{..., asset->},
        videoFile{asset->{url, mimeType}}
      }
    },
    credits,
    externalUrl,
    seoTitle,
    seoDescription
  }
`

export const allCaseStudySlugsQuery = groq`
  *[_type == "caseStudy" && defined(slug.current)][].slug.current
`

export const allCaseStudiesQuery = groq`
  *[_type == "caseStudy"] | order(coalesce(order, 9999) asc, year desc){
    _id,
    title,
    "slug": slug.current,
    client,
    year,
    summary,
    disciplines,
    thumbnailImage{..., asset->},
    featured
  }
`

export const featuredCaseStudiesQuery = groq`
  *[_type == "caseStudy" && featured == true] | order(coalesce(order, 9999) asc, year desc)[0...4]{
    _id,
    title,
    "slug": slug.current,
    client,
    year,
    summary,
    disciplines,
    thumbnailImage{..., asset->},
    heroImage{..., asset->},
    featured,
    isNew
  }
`

export const workIndexQuery = groq`
  *[_type == "caseStudy"] | order(coalesce(order, 9999) asc, year desc){
    _id,
    title,
    "slug": slug.current,
    client,
    year,
    summary,
    tagline,
    disciplines,
    isNew,
    gridImages[]{
      ...,
      _type == "image" => {
        alt,
        asset->{_id, metadata{dimensions{aspectRatio, width, height}}}
      },
      _type == "gridVideo" => {
        alt,
        aspectRatio,
        file{asset->{_id, url, mimeType}},
        poster{..., asset->}
      }
    },
    thumbnailImage{
      ..., alt,
      asset->{_id, metadata{dimensions{aspectRatio, width, height}}}
    }
  }
`

export const homePageQuery = groq`
  *[_type == "homePage"][0]{
    _id,
    heroVideoUrl,
    heroVideoPoster{..., asset->},
    introParagraph,
    newBusinessEmail,
    careersEmail,
    capabilities,
    questions[]{_key, label, body},
    clients[]->{_id, name, url},
    workIntroBlocks[]{_key, heading, body, images[]{..., asset->}},
    newsroomIntro,
    awardsHeading,
    awards[]{_key, description, award, year},
    seoTitle,
    seoDescription
  }
`

export const recentArticlesQuery = groq`
  *[_type == "article" && defined(slug.current)] | order(publishedAt desc)[0...16]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    coverImage{..., asset->},
    tags
  }
`

export const playItemsQuery = groq`
  *[_type == "playItem"] | order(row asc, coalesce(order, 9999) asc, _createdAt desc){
    _id,
    title,
    row,
    order,
    aspectRatio,
    image{..., asset->},
    videoFile{asset->{url, mimeType}},
    poster{..., asset->}
  }
`

// ---------------------------------------------------------------------------
// Convenience fetchers
// ---------------------------------------------------------------------------

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  const result = await sanityFetch<CaseStudy>(caseStudyBySlugQuery, {slug}, [
    `caseStudy:${slug}`,
  ])
  if (!result) return null
  await attachVideoPosters(result)
  return result
}

/**
 * Fetches a Vimeo clip's own thumbnail via the public oEmbed API. Cached for a
 * day (thumbnails are stable). Returns undefined for non-Vimeo URLs or failures.
 */
async function fetchVimeoThumbnail(url: string): Promise<string | undefined> {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return undefined
  }
  if (!hostname.includes('vimeo.com')) return undefined
  try {
    const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`
    const res = await fetch(endpoint, {next: {revalidate: 86400}})
    if (!res.ok) return undefined
    const data = (await res.json()) as {thumbnail_url?: unknown}
    return typeof data.thumbnail_url === 'string' ? data.thumbnail_url : undefined
  } catch {
    return undefined
  }
}

/**
 * Auto-poster pipeline: for Vimeo video blocks/slots with no manual poster (and
 * no self-hosted file), derive a `posterUrl` from Vimeo so a still frame shows
 * instantly while the embed loads. Mutates the body in place; runs lookups in
 * parallel and is a no-op when nothing needs a poster.
 */
async function attachVideoPosters(cs: CaseStudy): Promise<void> {
  if (!cs.body) return
  const tasks: Promise<void>[] = []

  const enrich = (v: VideoBlock | PairVideo) => {
    if (!v.url || v.poster || v.videoFile?.asset?.url) return
    tasks.push(
      fetchVimeoThumbnail(v.url).then((thumb) => {
        if (thumb) v.posterUrl = thumb
      }),
    )
  }

  for (const block of cs.body) {
    if (block._type === 'videoBlock') {
      enrich(block)
    } else if (block._type === 'mediaBlock' && block.images) {
      for (const item of block.images) {
        if (item._type === 'pairVideo') enrich(item)
      }
    }
  }

  await Promise.all(tasks)
}

export async function getAllCaseStudySlugs(): Promise<string[]> {
  const result = await sanityFetch<string[]>(allCaseStudySlugsQuery, {}, [
    'caseStudy',
  ])
  return result ?? []
}

export async function getFeaturedCaseStudies(): Promise<CaseStudyCard[]> {
  const result = await sanityFetch<CaseStudyCard[]>(
    featuredCaseStudiesQuery,
    {},
    ['caseStudy:featured'],
  )
  return result ?? []
}

export async function getWorkIndexCaseStudies(): Promise<CaseStudyCard[]> {
  const result = await sanityFetch<CaseStudyCard[]>(workIndexQuery, {}, [
    'caseStudy:index',
  ])
  return result ?? []
}

/**
 * The next `limit` case studies after `excludeSlug` in the work-index ordering,
 * wrapping back to the start if needed. Used by the "More work" section at the
 * end of each case study page. Reuses `getWorkIndexCaseStudies()` so the call
 * dedupes with the index page's fetch.
 */
export async function getNextCaseStudies(
  excludeSlug: string,
  limit = 2,
): Promise<CaseStudyCard[]> {
  const all = await getWorkIndexCaseStudies()
  if (all.length === 0) return []
  const idx = all.findIndex((c) => c.slug === excludeSlug)
  // Slug not in the index (drafts, unpublished — shouldn't normally happen for
  // a server-rendered case study page, but stay defensive): fall back to head.
  if (idx === -1) return all.slice(0, limit)
  const out: CaseStudyCard[] = []
  for (let step = 1; step <= all.length && out.length < limit; step++) {
    const candidate = all[(idx + step) % all.length]
    if (candidate.slug !== excludeSlug) out.push(candidate)
  }
  return out
}

export async function getHomePage(): Promise<HomePage | null> {
  const result = await sanityFetch<HomePage>(homePageQuery, {}, ['homePage'])
  return result ?? null
}

export async function getRecentArticles(): Promise<ArticleCard[]> {
  const result = await sanityFetch<ArticleCard[]>(recentArticlesQuery, {}, [
    'article',
  ])
  return result ?? []
}

export async function getPlayItems(): Promise<PlayItem[]> {
  const result = await sanityFetch<PlayItem[]>(playItemsQuery, {}, ['playItem'])
  return result ?? []
}

// Discipline label lookup — mirrors the `list` config in caseStudy.ts so
// stored values stay machine-readable while UIs show human labels.
export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  'brand-identity': 'Brand identity',
  strategy: 'Strategy',
  'digital-product': 'Digital product',
  website: 'Website',
  campaign: 'Campaign',
  packaging: 'Packaging',
  motion: 'Motion',
  editorial: 'Editorial',
  spatial: 'Spatial & retail',
  'service-design': 'Service design',
}

/**
 * Master, ordered list of every discipline (mirrors the schema order). Used to
 * render the full tag set on a case study, highlighting the selected ones.
 */
export const ALL_DISCIPLINES = Object.keys(DISCIPLINE_LABELS) as Discipline[]
