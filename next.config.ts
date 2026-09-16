import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fully static output. Every image and video on this site is pre-optimised by
  // scripts/optimize-media.mjs, so the runtime image optimiser is not needed and
  // the build deploys identically to any static host.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  productionBrowserSourceMaps: false,
}

export default nextConfig
