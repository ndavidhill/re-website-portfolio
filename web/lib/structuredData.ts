/**
 * schema.org builders. Consumed by <JsonLd> at the page level.
 *
 * Kept deliberately small: only claims we can actually back with content in the
 * CMS or the footer. Structured data that asserts things the page doesn't show
 * is a manual-action risk, not a ranking win.
 */
import type {CaseStudy} from './sanity'
import {urlForImage} from './sanity'
import {absoluteUrl, siteDescription, siteName, siteUrl} from './site'

/** Studio offices — mirrors the addresses rendered in ContactAndFooter. */
const OFFICES = [
  {
    streetAddress: 'Level 20, 25 Martin Place',
    addressLocality: 'Sydney',
    addressRegion: 'NSW',
    postalCode: '2000',
    addressCountry: 'AU',
  },
  {
    streetAddress: 'The Commons, 10-20 Gwynne St',
    addressLocality: 'Cremorne',
    addressRegion: 'VIC',
    postalCode: '3121',
    addressCountry: 'AU',
  },
] as const

/**
 * The studio itself. Rendered once, on the homepage — an Organization block
 * repeated on every route is noise, and Google only needs to see it on the
 * page it treats as the entity's home.
 */
export function organizationSchema(email?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    logo: absoluteUrl('/ReLogo.svg'),
    address: OFFICES.map((o) => ({'@type': 'PostalAddress', ...o})),
    ...(email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'sales',
            email,
          },
        }
      : {}),
  }
}

/**
 * A case study, as a CreativeWork the studio made for a named client. `about`
 * carries the client so the work is linked to the brand it was made for, which
 * is how these pages are actually searched for ("re design commbank").
 */
export function caseStudySchema(caseStudy: CaseStudy) {
  const image = caseStudy.heroImage
    ? urlForImage(caseStudy.heroImage).width(1200).auto('format').url()
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: caseStudy.title,
    headline: caseStudy.title,
    description: caseStudy.seoDescription ?? caseStudy.summary,
    url: absoluteUrl(`/work/${caseStudy.slug.current}`),
    ...(image ? {image} : {}),
    ...(caseStudy.year ? {dateCreated: String(caseStudy.year)} : {}),
    creator: {'@id': `${siteUrl}/#organization`},
    about: {'@type': 'Organization', name: caseStudy.client},
    ...(caseStudy.disciplines?.length
      ? {keywords: caseStudy.disciplines.join(', ')}
      : {}),
  }
}
