import type { Metadata } from 'next'
import { business, services } from '@/lib/business'
import { ContactBand } from '@/components/ContactBand'
import { Picture } from '@/components/Picture'
import { Reveal } from '@/components/Reveal'
import { VideoLoop } from '@/components/VideoLoop'
import type { ImageKey, VideoKey } from '@/lib/media'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Tree trimming, palm trees, clean-up and removal, stump grinding, planting, irrigation, lawn care and fencing in San Diego. Call or text (619) 622-1735.',
  alternates: { canonical: '/services/' },
}

const VIDEO_KEYS = new Set<string>(['tree', 'cleanup', 'trailer', 'fencing'])
const IMAGE_FOR: Record<string, ImageKey> = { planting: 'borderFinished' }

/**
 * Services page.
 *
 * Four of the nine have no honest photograph, so they get a full-width
 * typographic band instead of a borrowed or mislabelled image. That also does
 * useful work for the rhythm: the bands break up the media splits so the page
 * never runs three image-and-text rows back to back.
 *
 * Two counters drive the layout, and they are counted separately on purpose:
 *
 *   mediaIndex  alternates the media side. Counting position in the full list
 *               instead would have put the media on the left four times out of
 *               five, because of where the text-only services happen to fall.
 *   bandIndex   alternates the background of consecutive text-only bands, so two
 *               in a row read as two sections rather than one tall grey block.
 */
export default function ServicesPage() {
  let mediaIndex = -1
  let bandIndex = -1

  return (
    <>
      <section className="u-shell pb-16 pt-[calc(var(--header-h)+72px)] md:pb-24 md:pt-[calc(var(--header-h)+120px)]">
        <h1 className="u-display max-w-[13ch]">Every service.</h1>
        <p className="u-lede mt-6">
          Residential and property work across{' '}
          <span className="whitespace-nowrap">{business.serviceArea}</span>. We come to you.
        </p>
      </section>

      {services.map((service) => {
        if (!service.media) {
          bandIndex += 1
          const tinted = bandIndex % 2 === 0
          return (
            <section
              key={service.slug}
              id={service.slug}
              aria-labelledby={`${service.slug}-h`}
              className={`border-y border-rule ${tinted ? 'bg-paper-alt' : 'bg-paper'}`}
            >
              <div className="u-shell py-16 md:py-24">
                <Reveal>
                  <h2 id={`${service.slug}-h`} className="u-h2 max-w-[16ch]">
                    {service.name}
                  </h2>
                  {service.description && (
                    <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink-soft">
                      {service.description}
                    </p>
                  )}
                </Reveal>
              </div>
            </section>
          )
        }

        mediaIndex += 1
        const mediaOnRight = mediaIndex % 2 === 1
        const key = service.media

        return (
          <section
            key={service.slug}
            id={service.slug}
            aria-labelledby={`${service.slug}-h`}
            className="u-shell py-16 md:py-24"
          >
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-12">
              <Reveal
                className={`md:col-span-5 ${mediaOnRight ? 'md:order-2 md:col-start-8' : 'md:col-start-1'}`}
              >
                {VIDEO_KEYS.has(key) ? (
                  <VideoLoop
                    name={key as VideoKey}
                    sizes="(min-width: 768px) 40vw, 100vw"
                    className="aspect-3/4"
                  />
                ) : (
                  <figure className="u-media u-hover-zoom m-0 aspect-3/4">
                    <Picture name={IMAGE_FOR[key]} sizes="(min-width: 768px) 40vw, 100vw" />
                  </figure>
                )}
              </Reveal>

              <Reveal
                index={1}
                className={`md:col-span-6 ${mediaOnRight ? 'md:order-1 md:col-start-1' : 'md:col-start-7'}`}
              >
                <h2 id={`${service.slug}-h`} className="u-h2 max-w-[16ch]">
                  {service.name}
                </h2>
                {service.description && (
                  <p className="mt-5 max-w-[42ch] text-[1.0625rem] leading-relaxed text-ink-soft">
                    {service.description}
                  </p>
                )}
              </Reveal>
            </div>
          </section>
        )
      })}

      <ContactBand />
    </>
  )
}
