/**
 * The client's horizontal lockup, used as supplied.
 *
 * An earlier version composed the mark beside the name typeset in Archivo,
 * because the only artwork available then was a stacked lockup whose wordmark
 * rendered at roughly 20px inside a sane header. The horizontal lockup removes
 * that constraint, so the site now shows the real letterforms.
 *
 * Aspect ratio is fixed at the trimmed artwork's 1788x407. Declaring both
 * dimensions keeps the box reserved before the image decodes, which is part of
 * why CLS stays at zero.
 */

type Props = {
  className?: string
  /**
   * 'header' keeps the lockup compact enough for a 64-72px bar. At that size
   * the "LANDSCAPING | LAWN CARE" line is about 4px tall and reads as texture
   * rather than words, which is normal for a lockup in a navigation bar.
   *
   * 'footer' renders it larger, where there is room, so the tagline is legible
   * somewhere on the page.
   */
  size?: 'header' | 'footer'
}

/**
 * Density descriptors are per variant rather than shared. They are relative to
 * the element's rendered height, so a single srcset written for the 34px header
 * would hand the 60px footer an image half the resolution it needs on a 2x
 * display, and the wordmark would go soft exactly where it is largest.
 */
const VARIANTS = {
  header: {
    height: 'h-[30px] sm:h-[34px]',
    webp: '/media/logo/lockup-40.webp 1x, /media/logo/lockup-80.webp 2x, /media/logo/lockup-120.webp 3x',
    png: '/media/logo/lockup-40.png 1x, /media/logo/lockup-80.png 2x, /media/logo/lockup-120.png 3x',
    fallback: '/media/logo/lockup-40.png',
  },
  footer: {
    height: 'h-[52px] sm:h-[60px]',
    webp: '/media/logo/lockup-80.webp 1x, /media/logo/lockup-120.webp 2x, /media/logo/lockup-180.webp 3x',
    png: '/media/logo/lockup-80.png 1x, /media/logo/lockup-120.png 2x, /media/logo/lockup-180.png 3x',
    fallback: '/media/logo/lockup-80.png',
  },
} as const

export function Logo({ className = '', size = 'header' }: Props) {
  const v = VARIANTS[size]
  return (
    <picture>
      <source type="image/webp" srcSet={v.webp} />
      <img
        src={v.fallback}
        srcSet={v.png}
        alt="Nicolas Landscaping"
        width={1788}
        height={407}
        // The lockup is the accessible name of the link that wraps it, so this
        // carries real alt text rather than an empty string.
        className={`${v.height} w-auto ${className}`}
        decoding="async"
      />
    </picture>
  )
}
