import { business, services } from '@/lib/business'

/**
 * LocalBusiness structured data for a service-area business.
 *
 * Deliberately absent: aggregateRating, review, priceRange, foundingDate,
 * numberOfEmployees, award. None of those are verified, and inventing them in
 * schema is both dishonest and a Google structured-data violation.
 *
 * No streetAddress either. They travel to the customer, so the address is the
 * locality only, and areaServed carries the real signal.
 */
export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${business.siteUrl}/#business`,
    name: business.name,
    url: business.siteUrl,
    telephone: business.phone.tel,
    image: `${business.siteUrl}/og.jpg`,
    logo: `${business.siteUrl}/icon-512.png`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.serviceArea,
      addressRegion: business.region,
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: business.serviceArea,
      containedInPlace: { '@type': 'State', name: 'California' },
    },
    sameAs: [business.instagram.url],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Landscaping services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, areaServed: business.areaServed },
      })),
    },
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${business.siteUrl}/#website`,
    url: business.siteUrl,
    name: business.name,
    publisher: { '@id': `${business.siteUrl}/#business` },
  }
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Static, build-time data. No user input reaches this string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
