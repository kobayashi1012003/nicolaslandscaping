import type { MetadataRoute } from 'next'
import { business } from '@/lib/business'

export const dynamic = 'force-static'

/**
 * While business.indexable is false (temporary Netlify address) this disallows
 * everything and publishes no sitemap, so the throwaway URL never enters the
 * index and cannot compete with the real domain later.
 */
export default function robots(): MetadataRoute.Robots {
  if (!business.indexable) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${business.siteUrl}/sitemap.xml`,
    host: business.siteUrl,
  }
}
