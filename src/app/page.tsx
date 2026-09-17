import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRightIcon, ChatCircleTextIcon, PhoneIcon } from '@phosphor-icons/react/dist/ssr'
import { business } from '@/lib/business'
import { ContactBand } from '@/components/ContactBand'
import { Picture } from '@/components/Picture'
import { Reveal } from '@/components/Reveal'
import { ServicesIndex } from '@/components/ServicesIndex'
import { VideoLoop } from '@/components/VideoLoop'

export const metadata: Metadata = {
  title: 'Nicolas Landscaping | Tree Trimming and Yard Work in San Diego',
  description:
    'Tree trimming, palm trees, stump grinding, clean-ups, planting, irrigation, construction and fencing across San Diego. Call or text (619) 622-1735.',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <>
      {/* React 19 hoists this into <head>. It belongs on this page rather than
          the root layout: the hero poster is the LCP element here and nowhere
          else, and preloading it globally cost every other route a wasted 68kb.
          The srcset and sizes must match the <img> exactly or the browser
          treats it as a separate resource and downloads the image twice. */}
      <link
        rel="preload"
        as="image"
        href="/media/video/hero-poster-1080.avif"
        type="image/avif"
        imageSrcSet="/media/video/hero-poster-640.avif 640w, /media/video/hero-poster-800.avif 800w, /media/video/hero-poster-1080.avif 1080w"
        imageSizes="(min-width: 1024px) 44vw, calc(100vw - 40px)"
        fetchPriority="high"
      />

      {/* 01 Hero. Asymmetric split: the type holds the left, the portrait clip
          runs full height on the right and bleeds off the edge. */}
      <section className="u-shell grid min-h-[100svh] grid-cols-1 items-center gap-10 pb-16 pt-[calc(var(--header-h)+40px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] lg:gap-16 lg:pb-24 lg:pt-[calc(var(--header-h)+24px)]">
        <div>
          <h1 className="u-display max-w-[11ch]">Trimmed, cleared, planted.</h1>
          <p className="u-lede mt-6">
            Tree work, clean-ups and irrigation across{' '}
            {/* The place name must never break across two lines. */}
            <span className="whitespace-nowrap">{business.serviceArea}.</span>
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={`tel:${business.phone.tel}`} className="u-btn u-btn--solid">
              <PhoneIcon size={18} weight="fill" aria-hidden />
              Call {business.phone.display}
            </a>
            <a href={`sms:${business.phone.sms}`} className="u-btn u-btn--outline">
              <ChatCircleTextIcon size={18} weight="fill" aria-hidden />
              Text us
            </a>
          </div>
        </div>

        <div className="relative lg:h-[74svh] lg:min-h-[520px]">
          <VideoLoop
            name="hero"
            eager
            posterOnlyOnMobile
            sizes="(min-width: 1024px) 44vw, calc(100vw - 40px)"
            className="aspect-3/4 w-full lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:w-[calc(100%+max(20px,(100vw-1440px)/2+64px))]"
          />
        </div>
      </section>

      {/* 02 Services. Editorial index, type-led. */}
      <section className="u-shell py-20 md:py-28" aria-labelledby="services-heading">
        <Reveal>
          <h2 id="services-heading" className="u-h2 max-w-[14ch]">
            What we do.
          </h2>
        </Reveal>
        <Reveal index={1}>
          <div className="mt-12 md:mt-16">
            <ServicesIndex />
          </div>
        </Reveal>
        <Reveal index={2}>
          <Link
            href="/services/"
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-ink transition-colors hover:text-green"
          >
            All services
            <ArrowRightIcon size={18} aria-hidden />
          </Link>
        </Reveal>
      </section>

      {/* 03 Work. Portrait grid with deliberately uneven spans and offsets. */}
      <section className="bg-paper-alt py-20 md:py-28" aria-labelledby="work-heading">
        <div className="u-shell">
          <Reveal>
            <h2 id="work-heading" className="u-h2 max-w-[16ch]">
              Recent work.
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-4 md:mt-16 md:grid-cols-12 md:gap-6">
            <Reveal className="col-span-2 md:col-span-5" index={0}>
              <figure className="u-media u-hover-zoom aspect-3/4">
                <Picture name="crewBorder" sizes="(min-width: 768px) 40vw, 100vw" />
              </figure>
            </Reveal>

            <Reveal className="col-span-1 md:col-span-4 md:mt-16" index={1}>
              <figure className="u-media u-hover-zoom aspect-3/4">
                <Picture name="borderFinished" sizes="(min-width: 768px) 32vw, 50vw" />
              </figure>
            </Reveal>

            <Reveal className="col-span-1 md:col-span-3 md:mt-24" index={2}>
              <VideoLoop
                name="cleanup"
                sizes="(min-width: 768px) 24vw, 50vw"
                className="aspect-3/4"
              />
            </Reveal>

            <Reveal className="col-span-1 md:col-span-4 md:col-start-2" index={3}>
              <figure className="u-media u-hover-zoom aspect-3/4">
                <Picture name="borderProgress" sizes="(min-width: 768px) 32vw, 50vw" />
              </figure>
            </Reveal>

            <Reveal className="col-span-1 md:col-span-3 md:mt-12" index={4}>
              <figure className="u-media u-hover-zoom aspect-3/4">
                <Picture name="gravelChannel" sizes="(min-width: 768px) 24vw, 50vw" />
              </figure>
            </Reveal>

            <Reveal className="col-span-2 md:col-span-3 md:mt-24" index={5}>
              <VideoLoop name="tree" sizes="(min-width: 768px) 24vw, 100vw" className="aspect-3/4" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 04 Before and after. Real proof, one job, two honest frames. */}
      <section className="py-20 md:py-28" aria-labelledby="ba-heading">
        <div className="u-shell">
          <Reveal>
            <h2 id="ba-heading" className="u-h2 max-w-[18ch]">
              Same side yard, new fence.
            </h2>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 md:mt-16">
          <Reveal className="relative bg-paper">
            <figure className="m-0">
              <div className="u-media aspect-3/4 sm:aspect-4/5">
                <Picture name="fencingBefore" sizes="(min-width: 640px) 50vw, 100vw" />
              </div>
              <figcaption className="u-shell py-4 text-[0.8125rem] font-medium tracking-[0.14em] text-ink-soft sm:px-6">
                BEFORE
              </figcaption>
            </figure>
          </Reveal>

          <Reveal className="relative bg-paper" index={1}>
            <figure className="m-0">
              <VideoLoop
                name="fencing"
                sizes="(min-width: 640px) 50vw, 100vw"
                className="aspect-3/4 sm:aspect-4/5"
              />
              <figcaption className="u-shell py-4 text-[0.8125rem] font-medium tracking-[0.14em] text-green sm:px-6">
                AFTER
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* 05 Contact. */}
      <ContactBand />
    </>
  )
}
