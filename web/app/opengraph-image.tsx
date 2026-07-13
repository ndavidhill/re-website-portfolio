import {ImageResponse} from 'next/og'
import {colors} from '@/lib/design'
import {siteDescription, siteName} from '@/lib/site'

/**
 * Site-wide fallback OG card, inherited by every route that doesn't supply its
 * own image. Case studies override this with their hero image (see
 * app/work/[slug]/page.tsx), which is always the better card when we have one.
 *
 * Graphik isn't loaded here — ImageResponse would need the font bytes fetched
 * per render, and the fallback sans is close enough for a card that exists so
 * links aren't blank.
 */
export const alt = `${siteName} — ${siteDescription}`
export const size = {width: 1200, height: 630}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: colors.canvas,
          color: colors.textPrimary,
          padding: 72,
        }}
      >
        <div
          style={{
            fontSize: 104,
            fontWeight: 600,
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          {siteName}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 38,
            color: colors.textSecondary,
            letterSpacing: -0.5,
          }}
        >
          {siteDescription}
        </div>
      </div>
    ),
    size,
  )
}
