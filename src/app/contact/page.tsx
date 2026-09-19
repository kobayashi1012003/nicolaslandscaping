import type { Metadata } from 'next'
import { ChatCircleTextIcon, InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr'
import { business, services } from '@/lib/business'
import { Picture } from '@/components/Picture'
import { Reveal } from '@/components/Reveal'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Call or text Nicolas Landscaping on (619) 622-1735 for tree trimming, clean-ups, planting, irrigation, construction and fencing in San Diego.',
  alternates: { canonical: '/contact/' },
}

/**
 * Contact.
 *
 * No form, by decision. A homeowner standing in their yard wants to talk to
 * someone, and a form is a slower path to the same outcome plus a spam surface
 * and a backend to maintain. Three tap targets, nothing that can silently fail.
 */
export default function ContactPage() {
  return (
    <section className="u-shell pb-24 pt-[calc(var(--header-h)+72px)] md:pb-32 md:pt-[calc(var(--header-h)+120px)]">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <h1 className="u-display max-w-[10ch]">Get in touch.</h1>

          <Reveal index={1} disabled>
            <a
              href={`tel:${business.phone.tel}`}
              className="mt-10 block w-fit py-1.5 font-display text-ink transition-colors hover:text-green"
              style={{
                fontVariationSettings: "'wdth' 112, 'wght' 700",
                fontSize: 'clamp(2.25rem, 1.1rem + 5vw, 4.5rem)',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {business.phone.display}
            </a>
          </Reveal>

          {/* The number above is the call CTA. A button repeating it would be a
              second label for the same action, so this row carries the text
              option only. */}
          <Reveal index={2} disabled>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`sms:${business.phone.sms}`} className="u-btn u-btn--solid">
                <ChatCircleTextIcon size={18} weight="fill" aria-hidden />
                Text us
              </a>
            </div>
          </Reveal>

          <Reveal index={3} disabled>
            <dl className="mt-14 grid gap-8 border-t border-rule pt-10 sm:grid-cols-2">
              <div>
                <dt className="text-[0.8125rem] font-medium tracking-[0.14em] text-ink-soft">
                  SERVICE AREA
                </dt>
                <dd className="mt-2 text-[1.0625rem]">
                  Serving {business.serviceArea}. We travel to you, so there is no shop to visit.
                  {business.speaksSpanish ? ' Se habla español.' : ''}
                </dd>
              </div>
              <div>
                <dt className="text-[0.8125rem] font-medium tracking-[0.14em] text-ink-soft">
                  INSTAGRAM
                </dt>
                <dd className="mt-2">
                  <a
                    href={business.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 text-[1.0625rem] text-ink transition-colors hover:text-green"
                  >
                    <InstagramLogoIcon size={20} aria-hidden />
                    {business.instagram.handle}
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal index={4}>
            <div className="mt-12 border-t border-rule pt-10">
              <h2 className="u-h3">What we take on</h2>
              <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-2">
                {services.map((s) => (
                  <li
                    key={s.slug}
                    className="rounded-(--radius-control) border border-rule px-3 py-1.5 text-[0.875rem] text-ink-soft"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal disabled>
            <figure className="u-media aspect-3/4">
              <Picture name="borderFinished" priority sizes="(min-width: 1024px) 38vw, calc(100vw - 40px)" />
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
