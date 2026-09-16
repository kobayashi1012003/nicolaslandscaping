'use client'

import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'

/**
 * Route transition. Enter-only, keyed on the pathname.
 *
 * The `hasNavigated` gate is a performance fix, not a nicety. Passing an
 * `initial` of opacity 0 means Motion server-renders the whole of main with an
 * inline `opacity: 0`, so the browser cannot paint any of it until React has
 * hydrated and the animation has started. Lighthouse measured that as 217ms of
 * LCP element render delay, on every page, for an effect that has nothing to
 * transition from on a cold load.
 *
 * So: the first paint is opaque and immediate. Only an actual client-side
 * navigation gets the fade.
 *
 * `initial` is only read when the motion element mounts, and this one mounts
 * exactly when `key` changes, which is exactly a navigation. By then hydration
 * has long finished, so gating on `hydrated` alone is enough and every
 * navigation animates, including returning to the page first loaded.
 *
 * Exit animations are deliberately absent. Holding the outgoing page in the
 * tree via AnimatePresence means fighting the App Router over when the old
 * segment unmounts, and risks showing both pages at once.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  if (reduce) return <>{children}</>

  return (
    <motion.div
      key={pathname}
      initial={hydrated ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
