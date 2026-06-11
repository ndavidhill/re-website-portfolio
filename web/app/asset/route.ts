/**
 * Same-origin proxy for Sanity CDN assets, used so the WebGL progressive blur
 * can texture images and video (see lib/assetProxy.ts for the why). The server
 * fetch sends no browser `Origin`, so cdn.sanity.io answers 200 instead of the
 * 403 it returns to CORS requests; we stream the bytes straight back.
 *
 * Locked to cdn.sanity.io so this can't be used as an open proxy. Range
 * requests are forwarded so <video> can seek/stream.
 */

const ALLOWED_HOST = 'cdn.sanity.io'

const PASS_THROUGH = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'etag',
  'last-modified',
]

export async function GET(request: Request) {
  const u = new URL(request.url).searchParams.get('u')
  if (!u) return new Response('missing u', {status: 400})

  let target: URL
  try {
    target = new URL(u)
  } catch {
    return new Response('invalid url', {status: 400})
  }
  if (target.protocol !== 'https:' || target.hostname !== ALLOWED_HOST) {
    return new Response('forbidden host', {status: 403})
  }

  const range = request.headers.get('range')
  const upstream = await fetch(target, {
    headers: range ? {Range: range} : undefined,
    // Don't buffer large media into Next's data cache — just stream it.
    cache: 'no-store',
  })
  if (!upstream.ok && upstream.status !== 206) {
    return new Response('upstream error', {status: 502})
  }

  const headers = new Headers()
  for (const h of PASS_THROUGH) {
    const v = upstream.headers.get(h)
    if (v) headers.set(h, v)
  }
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new Response(upstream.body, {status: upstream.status, headers})
}
