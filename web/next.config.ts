import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
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
