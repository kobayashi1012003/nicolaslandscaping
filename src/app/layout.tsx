import type { Metadata, Viewport } from 'next'
import { Instrument_Sans } from 'next/font/google'
import '@/styles/globals.css'
import { business } from '@/lib/business'
import { JsonLd, localBusinessSchema, websiteSchema } from '@/lib/seo'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { MobileCallBar } from '@/components/MobileCallBar'
import { PageTransition } from '@/components/PageTransition'
import { SmoothScroll } from '@/components/SmoothScroll'

/**
 * Archivo carries a width axis, which is the reason it is on the site at all.
 * Headlines run at wdth 104-118 so they read wide and structural rather than as
 * another default grotesque. That second axis is also what made it expensive:
 * Google ships the whole designspace, weight 100-900 by width 62%-125%, and the
 * latin face came to 88kb.
 *
 * It is no longer loaded through next/font. scripts/build-fonts.mjs narrows the
 * axes to the range the CSS can actually reach and writes the faces into
 * public/fonts, and src/styles/fonts.css declares them with the same
 * unicode-ranges and the same metric-compatible fallback next/font generated.
 * Same glyphs, same metrics, 50kb instead of 88kb.
 */
const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(business.siteUrl),
  title: {
    default: 'Nicolas Landscaping | Tree Trimming and Yard Work in San Diego',
    template: '%s | Nicolas Landscaping',
  },
  description:
    'Tree trimming, palm trees, stump grinding, clean-ups, planting, irrigation, construction and fencing across San Diego. Call or text for a quote.',
  applicationName: business.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: business.siteUrl,
    siteName: business.name,
    title: 'Nicolas Landscaping | Tree Trimming and Yard Work in San Diego',
    description:
      'Tree trimming, palm trees, stump grinding, clean-ups, planting, irrigation, construction and fencing across San Diego.',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'A cut stone border and gravel drainage channel installed along a San Diego front yard.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nicolas Landscaping | Tree Trimming and Yard Work in San Diego',
    description: 'Tree work, clean-ups, planting and irrigation across San Diego.',
    images: ['/og.jpg'],
  },
  icons: {
    icon: [{ url: '/icon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  // Gated on business.indexable, which is what keeps a pre-launch host out of
  // the index. See the note on that flag.
  robots: business.indexable
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
}

export const viewport: Viewport = {
  themeColor: '#fcfcfb',
  // Never block zoom. Pinch-to-zoom is an accessibility feature.
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={instrument.variable}>
      <head>
        {/* The LCP preload lives on the home page, not here. Sitting in the root
            layout it fired on every route, downloading 68kb of hero poster on
            /services/ and /contact/ where that image never appears. */}
        {/* Scroll reveals are server-rendered at opacity 0 and animated in by
            Motion. If JS never runs, that would hide everything below the fold,
            so force them visible when scripting is unavailable. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <JsonLd data={localBusinessSchema()} />
        <JsonLd data={websiteSchema()} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-3 focus:text-paper"
        >
          Skip to content
        </a>

        <SmoothScroll>
          <Header />
          <main id="main">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <MobileCallBar />
        </SmoothScroll>
      </body>
    </html>
  )
}
