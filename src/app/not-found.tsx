import Link from 'next/link'
import { ArrowRightIcon, PhoneIcon } from '@phosphor-icons/react/dist/ssr'
import { business } from '@/lib/business'

export default function NotFound() {
  return (
    <section className="u-shell flex min-h-[70svh] flex-col justify-center pb-24 pt-[calc(var(--header-h)+72px)]">
      <p className="font-display text-green" style={{ fontVariationSettings: "'wdth' 118, 'wght' 700", fontSize: 'clamp(3rem,2rem+5vw,5rem)', lineHeight: 1 }}>
        404
      </p>
      <h1 className="u-h2 mt-4 max-w-[16ch]">That page is not here.</h1>
      <p className="u-lede mt-5">
        The link may be old or mistyped. The phone still works either way.
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <a href={`tel:${business.phone.tel}`} className="u-btn u-btn--solid">
          <PhoneIcon size={18} weight="fill" aria-hidden />
          Call {business.phone.display}
        </a>
        <Link href="/" className="u-btn u-btn--outline">
          Back to home
        </Link>
      </div>

      <nav aria-label="Site" className="mt-14 border-t border-rule pt-8">
        <ul className="flex flex-col gap-4">
          {[
            { href: '/services/', label: 'Services' },
            { href: '/contact/', label: 'Contact' },
          ].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="group inline-flex min-h-11 items-center gap-2 text-ink transition-colors hover:text-green"
              >
                <span className="u-h3">{l.label}</span>
                <ArrowRightIcon
                  size={20}
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
