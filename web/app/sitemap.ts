import type {MetadataRoute} from 'next'
import {getCaseStudySitemapEntries} from '@/lib/sanity'
import {absoluteUrl} from '@/lib/site'

/** Re-crawl the CMS hourly so newly published case studies appear without a redeploy. */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const caseStudies = await getCaseStudySitemapEntries()

  // Newest case-study edit doubles as the work index's lastmod — the index is
  // just a listing of them, so it changes exactly when one of them does.
  const latestCaseStudyEdit = caseStudies
    .map((c) => new Date(c._updatedAt))
    .sort((a, b) => b.getTime() - a.getTime())[0]

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: absoluteUrl('/work'),
      lastModified: latestCaseStudyEdit,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/info'),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/play'),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  return [
    ...staticRoutes,
    ...caseStudies.map((c) => ({
      url: absoluteUrl(`/work/${c.slug}`),
      lastModified: new Date(c._updatedAt),
      changeFrequency: 'yearly' as const,
      // The case studies are the substance of the site — rank them above /play
      // and /info, just under the homepage and the work index.
      priority: 0.8,
    })),
  ]
}
