'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Index within a group, for a light stagger. Keep groups small. */
  index?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'figure'
  /**
   * Render the children plainly, with no enter animation.
   *
   * Use this for anything above the fold. A reveal starts at opacity 0, and an
   * invisible element is not a Largest Contentful Paint candidate, so wrapping
   * the first image on a page in one delays its LCP until the animation runs.
   * There is also nothing to reveal: it is already in view when the page loads.
   */
  disabled?: boolean
}

/**
 * Enter-on-scroll. Opacity and a short rise, nothing else.
 *
 * Purpose: hierarchy. Content arrives in reading order as you reach it instead
 * of the whole page being present at once. That is the only job, so there is no
 * scale, no blur, no rotation and no infinite loop anywhere.
 *
 * Transform and opacity only, so it stays on the compositor. `once` means it
 * never replays and never costs anything on the way back up.
 */
export function Reveal({
  children,
  index = 0,
  className,
  as = 'div',
  disabled = false,
}: Props) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (disabled) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      // Motion server-renders `initial` as an inline opacity:0, so without this
      // hook the entire page below the fold is invisible when JS fails to run.
      // layout.tsx pairs it with a <noscript> rule that forces these visible.
      data-reveal=""
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -10% 0px' }}
      transition={{
        duration: 0.6,
        // Capped so a long group never leaves the last item waiting.
        delay: Math.min(index * 0.06, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </MotionTag>
  )
}
