'use client'

import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

type ScrollApi = {
  /** Scrolls to a selector, element or offset. Falls back to native when Lenis is absent. */
  scrollTo: (target: string | number | HTMLElement, opts?: Record<string, unknown>) => void
  /** Freezes the page behind an overlay. Depth counted, so nested overlays are safe. */
  lock: () => void
  unlock: () => void
}

const ScrollContext = createContext<ScrollApi | null>(null)

export function useSmoothScroll(): ScrollApi {
  const ctx = useContext(ScrollContext)
  if (ctx) return ctx
  // A safe no-Lenis fallback keeps call sites from having to null-check.
  return {
    scrollTo: (target) => {
      if (typeof target === 'number') window.scrollTo({ top: target })
      else if (typeof target === 'string') document.querySelector(target)?.scrollIntoView()
      else target.scrollIntoView()
    },
    lock: () => {},
    unlock: () => {},
  }
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const rafRef = useRef<number | null>(null)
  const lockDepth = useRef(0)
  const pathname = usePathname()

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const attach = () => {
      if (lenisRef.current || mq.matches) return
      lenisRef.current = new Lenis({
        // 0.09 reads as weight rather than delay. Lower feels like mud and
        // starts fighting the trackpad.
        lerp: 0.09,
        duration: 1.1,
        smoothWheel: true,
        // Left off deliberately. iOS momentum is better than anything
        // synthesised, and syncTouch is the main cause of "broken on my phone".
        syncTouch: false,
        wheelMultiplier: 1,
        anchors: { offset: -80 },
        stopInertiaOnNavigate: true,
      })

      // One loop, owned here, so teardown is deterministic.
      const raf = (time: number) => {
        lenisRef.current?.raf(time)
        rafRef.current = requestAnimationFrame(raf)
      }
      rafRef.current = requestAnimationFrame(raf)
    }

    const detach = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lenisRef.current?.destroy()
      lenisRef.current = null
    }

    attach()
    // People flip the OS setting mid-session; honour it live.
    const onChange = () => (mq.matches ? detach() : attach())
    mq.addEventListener('change', onChange)

    return () => {
      mq.removeEventListener('change', onChange)
      detach()
    }
  }, [])

  // Lenis keeps its own scroll position, so without this a route change lands
  // mid-page. force is required because scrollTo is ignored while stopped.
  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  // On back/forward let the browser restore position, then re-measure so the
  // internal target does not snap back.
  useEffect(() => {
    const onPopState = () => requestAnimationFrame(() => lenisRef.current?.resize())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const scrollTo = useCallback(
    (target: string | number | HTMLElement, opts?: Record<string, unknown>) => {
      const lenis = lenisRef.current
      if (lenis) {
        lenis.scrollTo(target as never, { force: true, ...opts })
        return
      }
      if (typeof target === 'number') window.scrollTo({ top: target })
      else if (typeof target === 'string') document.querySelector(target)?.scrollIntoView()
      else target.scrollIntoView()
    },
    []
  )

  // Pausing Lenis alone is not enough: native scroll leaks through under the
  // overlay. Pause it AND pin the body, compensating for the scrollbar so the
  // layout does not jump sideways as it disappears.
  const lock = useCallback(() => {
    lockDepth.current += 1
    if (lockDepth.current > 1) return
    lenisRef.current?.stop()
    const { body } = document
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
  }, [])

  const unlock = useCallback(() => {
    lockDepth.current = Math.max(0, lockDepth.current - 1)
    if (lockDepth.current > 0) return
    const { body } = document
    body.style.overflow = ''
    body.style.paddingRight = ''
    lenisRef.current?.start()
  }, [])

  const api = useMemo<ScrollApi>(() => ({ scrollTo, lock, unlock }), [scrollTo, lock, unlock])

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>
}
