'use client'

import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Route transition.
 *
 * Enter-only, keyed on the pathname. An exit animation would mean holding the
 * outgoing page in the tree via AnimatePresence, which in the App Router means
 * fighting the router over when the old segment unmounts and risks a flash of
 * both pages. A short fade and rise on arrival reads as continuity and cannot
 * break navigation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()

  if (reduce) return <>{children}</>

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
