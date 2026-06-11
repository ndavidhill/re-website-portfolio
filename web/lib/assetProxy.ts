/**
 * Rewrites a Sanity CDN asset URL to our same-origin `/asset` proxy.
 *
 * Why this exists: cdn.sanity.io serves assets fine for normal <img>/<video>
 * loads, but returns 403 to any request carrying an `Origin` header — i.e. any
 * CORS request. WebGL can only texture from same-origin or CORS-enabled
 * sources, so sampling a Sanity image/video directly is impossible. Routing it
 * through our own origin (where the server-side fetch sends no browser Origin)
 * makes the bytes same-origin, so the texture is clean.
 *
 * Non-Sanity URLs pass through untouched.
 */
export function proxyAsset(url: string): string {
  if (!url || !url.startsWith('https://cdn.sanity.io/')) return url
  return `/asset?u=${encodeURIComponent(url)}`
}
