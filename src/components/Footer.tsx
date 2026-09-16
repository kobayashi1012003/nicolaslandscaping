import Link from 'next/link'
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr'
import { business } from '@/lib/business'
import { Logo } from '@/components/Logo'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services/', label: 'Services' },
  { href: '/contact/', label: 'Contact' },
]

/**
 * Every link here is given a 44px minimum height. Footer links are routinely
 * the smallest targets on a site and they are exactly where someone hunting for
 * a phone number ends up.
 *
 * The one exception is the studio credit, which sits inside a sentence. WCAG
 * 2.5.8 exempts inline links in a block of text, and padding it out would break
 * the line it lives in.
 */
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-rule bg-paper">
      {/* Watched by MobileCallBar so the sticky bar gets out of the way here. */}
      <div id="footer-sentinel" aria-hidden className="h-px w-full" />

      <div className="u-shell py-14 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="-mx-1 flex min-h-11 w-fit items-center rounded-sm px-1">
            <Logo size="footer" />
          </Link>

          <div className="grid gap-8 sm:grid-cols-2 md:gap-16">
            <nav aria-label="Footer">
              <ul className="flex flex-col">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-flex min-h-11 items-center text-[0.9375rem] text-ink-soft transition-colors hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col">
              <a
                href={`tel:${business.phone.tel}`}
                className="inline-flex min-h-11 w-fit items-center font-display text-ink transition-colors hover:text-green"
                style={{ fontVariationSettings: "'wdth' 110, 'wght' 620", fontSize: '1.25rem' }}
              >
                {business.phone.display}
              </a>
              <a
                href={business.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-fit items-center gap-2 text-[0.9375rem] text-ink-soft transition-colors hover:text-ink"
              >
                <InstagramLogoIcon size={18} aria-hidden />
                {business.instagram.handle}
              </a>
              <p className="mt-1 text-[0.9375rem] text-ink-soft">Serving {business.serviceArea}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-rule pt-6 text-[0.8125rem] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {business.name}
          </p>
          <p>
            Website designed by{' '}
            <a
              href={business.credit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="u-link"
            >
              {business.credit.label}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
