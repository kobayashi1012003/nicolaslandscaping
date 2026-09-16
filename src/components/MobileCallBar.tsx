'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { ChatCircleTextIcon, PhoneIcon } from '@phosphor-icons/react/dist/ssr'
import { business } from '@/lib/business'

/**
 * Persistent call and text bar, mobile only.
 *
 * Three rules it has to respect:
 *
 *   1. It must not cover the footer. A sentinel at the top of the footer hides
 *      the bar as soon as the footer enters view, so the studio credit and the
 *      footer links are never sitting underneath it.
 *   2. It must not duplicate the hero. It stays out of the way until the visitor
 *      has scrolled past the hero CTAs, then takes over that job.
 *   3. It must sit above the iOS home indicator, hence the safe-area inset, and
 *      it publishes its own height as --callbar-h so scroll-padding-bottom can
 *      keep keyboard focus clear of it (WCAG 2.4.11).
 */
export function MobileCallBar() {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const [pastHero, setPastHero] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => setPastHero(y > 320))

  useEffect(() => {
    const sentinel = document.getElementById('footer-sentinel')
    if (!sentinel) return
    const io = new IntersectionObserver(([e]) => setFooterVisible(e.isIntersecting), {
      rootMargin: '0px 0px -40px 0px',
    })
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  const shown = pastHero && !footerVisible

  useEffect(() => {
    document.documentElement.style.setProperty('--callbar-h', shown ? '72px' : '0px')
  }, [shown])

  return (
    <motion.div
      initial={false}
      animate={{ y: shown ? '0%' : '110%' }}
      transition={reduce ? { duration: 0 } : { duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-hidden={!shown}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <a
          href={`tel:${business.phone.tel}`}
          className="u-btn u-btn--solid flex-1"
          tabIndex={shown ? 0 : -1}
        >
          <PhoneIcon size={18} weight="fill" aria-hidden />
          Call
        </a>
        <a
          href={`sms:${business.phone.sms}`}
          className="u-btn u-btn--outline flex-1"
          tabIndex={shown ? 0 : -1}
        >
          <ChatCircleTextIcon size={18} weight="fill" aria-hidden />
          Text
        </a>
      </div>
    </motion.div>
  )
}
