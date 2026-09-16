/**
 * SINGLE SOURCE OF TRUTH for every piece of business information on this site.
 *
 * Nothing here is invented. If a value is not confirmed by the owner it is left
 * as `null` and the UI omits that element entirely rather than guessing.
 *
 * To update the site's phone number, services, or social links, edit this file
 * only. Nothing else needs to change.
 */

export const business = {
  name: 'Nicolas Landscaping',

  /** Service-area business. They travel to the customer, so no street address is shown. */
  serviceArea: 'San Diego',
  region: 'CA',
  areaServed: 'San Diego, California',

  /** Outcall service, so opening hours are deliberately not displayed. */
  hours: null,

  phone: {
    display: '(619) 622-1735',
    tel: '+16196221735',
    sms: '+16196221735',
  },

  instagram: {
    url: 'https://www.instagram.com/nicolas_landscaping619/',
    handle: '@nicolas_landscaping619',
  },

  /**
   * TODO(owner): replace with the real production domain once it exists.
   * Currently the temporary Netlify deploy. Drives canonical URLs, sitemap.xml,
   * robots.txt, Open Graph and JSON-LD.
   */
  siteUrl: 'https://nicolaslandscaping.netlify.app',

  /**
   * Search indexing. FALSE while the site lives on the temporary Netlify
   * address, and that is deliberate.
   *
   * If Google indexes the netlify.app URL, those pages do not disappear when
   * the real domain goes live. They linger in results, compete with the real
   * site for the same local searches, and split the ranking signal. Cleaning
   * that up afterwards is far more work than waiting.
   *
   * Flip to true in the same commit that sets the real siteUrl above. That
   * switches robots.txt from disallow to allow, drops the noindex meta tag and
   * publishes the sitemap.
   */
  indexable: false,

  /** Confirmed by the owner: Nicolas is a native Spanish speaker. */
  speaksSpanish: true,

  credit: {
    label: 'Le Design Studio',
    url: 'https://ledesign-studio.com/',
  },
} as const

export type Service = {
  /** Stable anchor id. Changing these breaks inbound links. */
  slug: string
  name: string
  /** One plain line, under ~12 words. `null` renders the name alone. */
  description: string | null
  /** Key into the media manifest, or null when no honest image exists yet. */
  media: string | null
}

/**
 * The service list, in the order the owner gave it.
 *
 * DRAFT COPY: descriptions marked below are standard descriptions of the trade,
 * not claims about this business. Confirm before launch.
 */
export const services: Service[] = [
  {
    slug: 'tree-trimming',
    name: 'Tree Trimming',
    description: 'Shaping, thinning and deadwood removal on mature trees.',
    media: 'tree',
  },
  {
    slug: 'palm-trees',
    name: 'Palm Trees',
    description: 'Dead fronds and seed pods removed, trunks cleaned up.',
    media: null,
  },
  {
    slug: 'clean-up-removal',
    name: 'Clean-Up / Removal',
    description: 'Overgrowth, brush and green waste cleared out.',
    media: 'cleanup',
  },
  {
    slug: 'stump-grinding',
    name: 'Stump Grinding',
    description: 'Stumps ground below grade so the ground can be replanted.',
    media: null,
  },
  {
    slug: 'service-with-trailer',
    name: 'Service with Trailer',
    // NEEDS NICOLAS TO CONFIRM. This line reflects the client contact's best
    // guess (hauling green waste away by trailer), not the owner's own words.
    // Verify before launch or replace it.
    description: 'Cuttings and green waste hauled away by trailer.',
    media: 'trailer',
  },
  {
    slug: 'planting',
    name: 'Planting',
    description: 'New plants and trees set in and fertilized.',
    media: 'planting',
  },
  {
    slug: 'irrigation-systems',
    name: 'Irrigation Systems',
    description: 'Drip and spray lines installed, repaired and adjusted.',
    media: null,
  },
  {
    slug: 'lawn-care',
    name: 'Lawn Care',
    // On the logo lockup alongside Landscaping, and confirmed in scope by the
    // client contact. Wording is standard for the trade; confirm with Nicolas.
    description: 'Mowing, edging and regular upkeep.',
    media: null,
  },
  {
    slug: 'fencing',
    name: 'Fencing',
    // Confirmed in scope as general fencing. Wood and vinyl are both evidenced
    // by the owner's own before and after footage of the side yard job.
    description: 'New fences built and old ones replaced, wood or vinyl.',
    media: 'fencing',
  },
]
