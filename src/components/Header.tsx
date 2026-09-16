'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { ListIcon, PhoneIcon, XIcon } from '@phosphor-icons/react/dist/ssr'
import { business } from '@/lib/business'
import { Logo } from '@/components/Logo'
import { useSmoothScroll } from '@/components/SmoothScroll'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/services/', label: 'Services' },
  { href: '/contact/', label: 'Contact' },
]

export function Header() {
  const pathname = usePathname()
  const { scrollTo, lock, unlock } = useSmoothScroll()
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()

  const [hidden, setHidden] = useState(false)
  const [lifted, setLifted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const lastY = useRef(0)

  // Direction tracking off the motion value rather than a scroll listener, so
  // nothing re-renders per frame. State flips only when the direction changes.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = lastY.current
    lastY.current = y
    setLifted(y > 8)
    if (menuOpen) return
    // Ignore the iOS rubber-band region and tiny jitter.
    if (y < 120 || Math.abs(y - prev) < 6) {
      if (y < 120) setHidden(false)
      return
    }
    setHidden(y > prev)
  })

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Close on route change so the panel never survives a navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Scroll lock, Esc to close, and focus handling while the panel is open.
  useEffect(() => {
    if (!menuOpen) return
    lock()
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
        return
      }
      if (e.key !== 'Tab') return
      // Keep Tab inside the panel while it is the only thing on screen.
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlock()
      // Send focus back where it came from, not to the top of the document.
      ;(previouslyFocused ?? toggleRef.current)?.focus?.()
    }
  }, [menuOpen, lock, unlock, closeMenu])

  /**
   * The logo always means "home, at the top". From another page that is a normal
   * navigation. From the home page itself a navigation would do nothing visible,
   * so scroll to the top instead.
   */
  const onLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      setMenuOpen(false)
      scrollTo(0)
    }
  }

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={false}
        animate={{ y: hidden && !menuOpen ? '-100%' : '0%' }}
        transition={reduce ? { duration: 0 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={`transition-colors duration-300 ${
            lifted && !menuOpen
              ? 'border-b border-rule bg-paper/92 backdrop-blur-md'
              : 'border-b border-transparent bg-transparent'
          }`}
        >
          <div className="u-shell flex h-(--header-h) items-center justify-between gap-4">
            {/* No aria-label here. Replacing the accessible name with one that
                does not contain the visible text breaks WCAG 2.5.3 Label in
                Name, so a voice-control user saying "Nicolas Landscaping" would
                not match this link. The visible wordmark is the name; the extra
                context is appended for screen readers only. */}
            <Link
              href="/"
              onClick={onLogoClick}
              className="-mx-1 flex min-h-11 shrink-0 items-center rounded-sm px-1"
            >
              <Logo />
              <span className="sr-only">, back to the top of the home page</span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
              {NAV.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative inline-flex min-h-11 items-center text-[0.9375rem] font-medium transition-colors ${
                      active ? 'text-ink' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-ink transition-transform duration-300 ${
                        active ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </Link>
                )
              })}
              <a href={`tel:${business.phone.tel}`} className="u-btn u-btn--solid">
                <PhoneIcon size={17} weight="fill" aria-hidden />
                {business.phone.display}
              </a>
            </nav>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="-mr-2 grid h-12 w-12 place-items-center md:hidden"
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              {menuOpen ? <XIcon size={26} aria-hidden /> : <ListIcon size={26} aria-hidden />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile panel. Rendered outside the sliding header so it never moves. */}
      <motion.div
        id="mobile-menu"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        initial={false}
        animate={{ x: menuOpen ? '0%' : '100%' }}
        transition={reduce ? { duration: 0 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-40 flex flex-col bg-paper md:hidden"
        style={{ visibility: menuOpen ? 'visible' : 'hidden' }}
        // Keep the panel out of the tab order and the a11y tree while closed.
        aria-hidden={!menuOpen}
      >
        <div className="h-(--header-h)" />
        <nav aria-label="Site" className="u-shell flex flex-1 flex-col justify-center gap-1 pb-24">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              aria-current={pathname === item.href ? 'page' : undefined}
              className="u-h2 border-b border-rule py-5 text-ink"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${business.phone.tel}`}
            onClick={closeMenu}
            className="u-btn u-btn--solid mt-8 w-full"
          >
            <PhoneIcon size={18} weight="fill" aria-hidden />
            Call {business.phone.display}
          </a>
          <a
            href={`sms:${business.phone.sms}`}
            onClick={closeMenu}
            className="u-btn u-btn--outline mt-3 w-full"
          >
            Text us
          </a>
        </nav>
      </motion.div>
    </>
  )
}
