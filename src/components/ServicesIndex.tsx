import Link from 'next/link'
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr'
import { services } from '@/lib/business'

/**
 * The service list as an editorial index rather than a card grid.
 *
 * Deciding factor: most of these services have no honest photograph. A card grid
 * would have forced either empty cards or borrowed, mislabelled images. Setting
 * the names large lets the list carry itself typographically, so a missing photo
 * reads as restraint rather than as a hole.
 *
 * Hovering a row used to raise a preview still beside the list. It is gone at the
 * client's request. The row still answers to the pointer — the name slides, the
 * arrow leads — which is all the affordance a link needs.
 */
export function ServicesIndex() {
  return (
    <ul className="border-t border-rule">
      {services.map((service) => (
        <li key={service.slug} className="border-b border-rule">
          <Link
            href={`/services/#${service.slug}`}
            className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:py-7"
          >
            <span className="u-row-title col-start-1 text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:group-hover:translate-x-2">
              {service.name}
            </span>

            {service.description ? (
              <span className="col-span-2 max-w-[42ch] text-[0.9375rem] leading-snug text-ink-soft md:col-span-1 md:col-start-2">
                {service.description}
              </span>
            ) : (
              <span className="hidden md:block" />
            )}

            <span
              aria-hidden
              className="col-start-2 row-start-1 justify-self-end text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:col-start-3 md:group-hover:translate-x-1 md:group-hover:text-green"
            >
              <ArrowRightIcon size={22} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
