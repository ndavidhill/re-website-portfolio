/**
 * Canonical origin for the site.
 *
 * Canonicals, OG image URLs, the sitemap and robots.txt all need absolute URLs,
 * so the origin has to resolve on every environment — local, preview, and
 * production. Resolution order:
 *
 *   1. NEXT_PUBLIC_SITE_URL          — set this to the custom domain once DNS is
 *                                      live. Overrides everything else.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel injects this automatically. It is
 *                                      the *production* hostname even when the
 *                                      current build is a preview, which is what
 *                                      canonicals want: previews should point at
 *                                      production, not at themselves.
 *   3. localhost                     — dev.
 *
 * Note (2) is a server-only var (no NEXT_PUBLIC_ prefix). That's fine — every
 * consumer here (generateMetadata, sitemap, robots) runs on the server.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}

export const siteUrl = resolveSiteUrl()

/** Studio-wide constants reused across metadata and structured data. */
export const siteName = 're.design'
export const siteDescription = 'Independent design studio.'

/** Absolute URL for a site-relative path — `/work` → `https://…/work`. */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString()
}
