import type { MetadataRoute } from 'next'
import { business } from '@/lib/business'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  // Nothing to submit while the site is parked on the temporary address.
  if (!business.indexable) return []

  const now = new Date()
  return [
    { url: `${business.siteUrl}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${business.siteUrl}/services/`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${business.siteUrl}/contact/`, lastModified: now, changeFrequency: 'yearly', priority: 0.7 },
  ]
}
