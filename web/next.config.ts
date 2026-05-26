import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
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
