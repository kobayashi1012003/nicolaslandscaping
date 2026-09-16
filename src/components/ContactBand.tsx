import { ChatCircleTextIcon, InstagramLogoIcon, PhoneIcon } from '@phosphor-icons/react/dist/ssr'
import { business } from '@/lib/business'
import { Reveal } from '@/components/Reveal'

/**
 * The one place on the site where the green goes full bleed.
 *
 * Holding it back everywhere else is what makes it land here. The phone number
 * is set at display scale because it is the single most useful thing on the
 * page, not because big type looks nice.
 */
export function ContactBand() {
  return (
    <section className="bg-green-deep text-paper">
      <div className="u-shell py-20 md:py-28">
        <Reveal>
          <h2 className="u-h2 max-w-[16ch] text-paper">Tell us what the yard needs.</h2>
        </Reveal>

        <Reveal index={1}>
          <a
            href={`tel:${business.phone.tel}`}
            className="mt-8 block w-fit font-display text-paper transition-opacity hover:opacity-80"
            style={{
              fontVariationSettings: "'wdth' 112, 'wght' 700",
              fontSize: 'clamp(2.25rem, 1.2rem + 4.6vw, 4.75rem)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {business.phone.display}
          </a>
        </Reveal>

        <Reveal index={2}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href={`tel:${business.phone.tel}`} className="u-btn u-btn--onGreen">
              <PhoneIcon size={18} weight="fill" aria-hidden />
              Call now
            </a>
            <a href={`sms:${business.phone.sms}`} className="u-btn u-btn--onGreenOutline">
              <ChatCircleTextIcon size={18} weight="fill" aria-hidden />
              Send a text
            </a>
            <a
              href={business.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="u-btn u-btn--onGreenOutline"
            >
              <InstagramLogoIcon size={18} aria-hidden />
              {business.instagram.handle}
            </a>
          </div>
        </Reveal>

        <Reveal index={3}>
          <p className="mt-10 text-[0.9375rem] text-paper/70">
            Serving {business.serviceArea}. We come to you.
            {business.speaksSpanish ? ' Se habla español.' : ''}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
