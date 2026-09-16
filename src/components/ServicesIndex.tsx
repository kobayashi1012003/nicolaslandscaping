'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr'
import { services } from '@/lib/business'
import { previewSources } from '@/lib/media'

/**
 * The service list as an editorial index rather than a card grid.
 *
 * Deciding factor: three of these services have no honest photograph. A card
 * grid would have forced either three empty cards or three borrowed, mislabelled
 * images. Setting the names large and letting a preview appear beside them on
 * hover means the list carries itself typographically, and a missing photo reads
 * as restraint rather than as a hole.
 *
 * The preview is a desktop pointer affordance only. Touch users get the same
 * information from the row itself, and tapping goes straight to the service.
 */
export function ServicesIndex() {
  const [active, setActive] = useState<string | null>(null)
  const reduce = useReducedMotion()
  const preview = active ? previewSources(active) : null

  return (
    <div className="relative">
      <ul className="border-t border-rule">
        {services.map((service) => (
          <li key={service.slug} className="border-b border-rule">
            <Link
              href={`/services/#${service.slug}`}
              onMouseEnter={() => setActive(service.media)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(service.media)}
              onBlur={() => setActive(null)}
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

      {/* Hover preview. Pointer devices only, and never under reduced motion. */}
      {!reduce && (
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 lg:block"
        >
          <AnimatePresence mode="wait">
            {preview && (
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="u-media h-[340px] w-[255px] shadow-[0_24px_60px_-24px_rgba(19,21,19,0.35)]"
              >
                <picture>
                  <source type="image/avif" srcSet={preview.avif} />
                  <source type="image/webp" srcSet={preview.webp} />
                  <img src={preview.jpg} alt="" width={640} height={853} loading="lazy" />
                </picture>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
