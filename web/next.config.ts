import type {NextConfig} from 'next'

/**
 * Cutover redirects: Prismic site → this build.
 *
 * The old site served case studies at the same path this one does — /work/<slug>
 * — so the 20 case studies that kept their slug need no redirect; their URLs
 * still resolve. Only two classes of old URL break at cutover:
 *
 *   1. 44 case studies dropped in the content cull. Their /work/<slug> pages no
 *      longer exist, so they 301 to the /work index (CULLED_WORK below).
 *   2. A handful of projects that survived under a new slug, and the section
 *      pages the new IA folded away (/about, /careers, /contact → /info; the
 *      /think article section, which has no equivalent here → home). These are
 *      spelled out individually so each keeps a specific, relevant target
 *      rather than being dumped on the index.
 *
 * Slug lists were derived by diffing the live Prismic API against Sanity on
 * 2026-07-15. `permanent: true` emits 308, which search engines treat as a 301.
 */

// Case studies removed in the cull — old /work/<slug> → /work index.
const CULLED_WORK = [
  'a2-milk', 'actionaid', 'arise', 'bango', 'bare-witness', 'cognyte',
  'crohns-colitis-uk', 'dext', 'dhre', 'durasein', 'east-west-rail', 'ethos-urban',
  'everydayrewards', 'fifa', 'fora', 'fyta', 'g42', 'heritage', 'ignition', 'kenwood',
  'ma-financial-group', 'majorplayers', 'manchester-united',
  'national-breast-cancer-foundation', 'onegreenway', 'oppo-brand-experience',
  'optus-employer-brand', 'optus-retail', 'skyscanner', 'skyscanner-brand-experience',
  'snap-send-solve', 'stylus', 'sydney-design-festival', 'sydneyworldpride',
  'telecommunications', 'test-page', 'the-global-fund', 'true-north', 'unsw',
  'versus-arthritis', 'virgin-atlantic', 'we-know-telcos', 'woolworths1', 'youngpoet',
]

// Projects that survived the cull but under a renamed slug — 301 to the new page
// so their existing search ranking carries over.
const RENAMED_WORK: Record<string, string> = {
  'optus': '/work/optus-refresh',
  'swisscom': '/work/swisscom-brand-experience',
  'franklin-templeton': '/work/franklitempleton',
  'all-blacks-and-black-ferns': '/work/nzr',
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...CULLED_WORK.map((slug) => ({
        source: `/work/${slug}`,
        destination: '/work',
        permanent: true,
      })),
      ...Object.entries(RENAMED_WORK).map(([slug, destination]) => ({
        source: `/work/${slug}`,
        destination,
        permanent: true,
      })),
      // IA changes: the old standalone pages now live inside /info.
      {source: '/about', destination: '/info', permanent: true},
      {source: '/careers', destination: '/info', permanent: true},
      {source: '/contact', destination: '/info', permanent: true},
      // The /think article section has no equivalent in this build (the newsroom
      // is dormant), so its index and every article route resolve to home.
      {source: '/think', destination: '/', permanent: true},
      {source: '/think/:slug*', destination: '/', permanent: true},
    ]
  },
  experimental: {
    // React <ViewTransition> integration — drives the cross-route page
    // transitions + the work-card → case-study shared-element morph.
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {protocol: 'https', hostname: 'cdn.sanity.io'},
    ],
    // Skip Next's optimizer for Sanity images — let the Sanity CDN serve
    // directly at the requested width/quality. See lib/sanity-image-loader.ts.
    loader: 'custom',
    loaderFile: './lib/sanity-image-loader.ts',
  },
}

export default nextConfig
