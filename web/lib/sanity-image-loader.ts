import type {ImageLoaderProps} from 'next/image'

/**
 * Custom next/image loader for Sanity-hosted images.
 *
 * By default, next/image fetches the Sanity URL and re-encodes it through its
 * own optimizer (/_next/image). That double pass — Sanity → Next — visibly
 * degrades high-resolution uploads (WebP especially) and burns Vercel image
 * credits for no benefit, since Sanity's CDN already serves optimized variants.
 *
 * This loader returns the Sanity URL directly so the browser fetches straight
 * from the CDN at the responsive width Next chose. We override sizing and
 * quality params but keep any hotspot/crop params (rect, fp-x, fp-y, …) so
 * cropped images still render correctly. Non-Sanity sources pass through.
 */
export default function sanityImageLoader({src, width, quality}: ImageLoaderProps): string {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return src
  }
  if (!url.hostname.includes('cdn.sanity.io')) return src

  url.searchParams.set('w', String(width))
  url.searchParams.set('auto', 'format')
  url.searchParams.set('q', String(quality ?? 90))
  url.searchParams.set('fit', 'max')
  return url.toString()
}
