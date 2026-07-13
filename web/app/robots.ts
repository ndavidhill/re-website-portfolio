import type {MetadataRoute} from 'next'
import {siteUrl} from '@/lib/site'

/**
 * `/asset` is a same-origin byte-for-byte proxy of cdn.sanity.io (it exists so
 * the WebGL blur can texture cross-origin media). Letting crawlers walk it would
 * spend crawl budget re-fetching images they can already reach at their canonical
 * CDN URL, so it's disallowed. `/api` is internal.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/asset'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
