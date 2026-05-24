/**
 * Convert a Vimeo or YouTube watch URL into an autoplaying, muted, looping,
 * chrome-free "background" embed URL. Vimeo's `background=1` mode fills (and
 * crops to cover) its iframe, which is what lets these sit in fixed-aspect
 * frames. Returns null for unrecognised hosts.
 */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0]
      if (!id) return null
      const params = new URLSearchParams({
        autoplay: '1',
        muted: '1',
        loop: '1',
        controls: '0',
        title: '0',
        byline: '0',
        portrait: '0',
        background: '1',
        dnt: '1',
      })
      return `https://player.vimeo.com/video/${id}?${params.toString()}`
    }
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id =
        u.hostname === 'youtu.be'
          ? u.pathname.slice(1)
          : u.searchParams.get('v')
      if (!id) return null
      const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        loop: '1',
        playlist: id,
        controls: '0',
        modestbranding: '1',
        rel: '0',
        playsinline: '1',
      })
      return `https://www.youtube.com/embed/${id}?${params.toString()}`
    }
    return null
  } catch {
    return null
  }
}
