import type { MetadataRoute } from 'next'
import { business } from '@/lib/business'

export const dynamic = 'force-static'

/**
 * While business.indexable is false this disallows everything and publishes no
 * sitemap, so a throwaway host never enters the index and cannot compete with
 * the real domain later. It is true now, so this allows and publishes.
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
