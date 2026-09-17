/**
 * The client's logo, used as supplied, in whichever lockup suits the space.
 *
 * An earlier version composed the mark beside the name typeset in Archivo,
 * because the only artwork available then was a stacked lockup whose wordmark
 * rendered at roughly 20px inside a sane header. Both real lockups are now
 * available, so the site shows the real letterforms in both places.
 *
 * Each variant declares the trimmed artwork's own dimensions. Declaring both
 * keeps the box reserved before the image decodes, which is part of why CLS
 * stays at zero — and the two lockups have different aspect ratios, so the
 * numbers cannot be shared.
 */

type Props = {
  className?: string
  /**
   * 'header' is the horizontal lockup, sized to fill most of the 64-72px bar.
   *
   * 'footer' is the stacked lockup — mark above wordmark — at a size where the
   * "LANDSCAPING | CONSTRUCTION" line is legible rather than texture.
   */
  size?: 'header' | 'footer'
}

/**
 * Density descriptors are per variant rather than shared. They are relative to
 * the element's rendered height, so a single srcset written for the header
 * would hand the much larger footer an image a fraction of the resolution it
 * needs on a 2x display, and the wordmark would go soft exactly where it is
 * largest.
 */
const VARIANTS = {
  header: {
    height: 'h-[46px] sm:h-[54px]',
    width: 2128,
    intrinsicHeight: 435,
    webp: '/media/logo/lockup-80.webp 1x, /media/logo/lockup-120.webp 2x, /media/logo/lockup-180.webp 3x',
    png: '/media/logo/lockup-80.png 1x, /media/logo/lockup-120.png 2x, /media/logo/lockup-180.png 3x',
    fallback: '/media/logo/lockup-80.png',
  },
  footer: {
    height: 'h-[104px] sm:h-[120px]',
    width: 1423,
    intrinsicHeight: 758,
    webp: '/media/logo/stacked-120.webp 1x, /media/logo/stacked-240.webp 2x, /media/logo/stacked-360.webp 3x',
    png: '/media/logo/stacked-120.png 1x, /media/logo/stacked-240.png 2x, /media/logo/stacked-360.png 3x',
    fallback: '/media/logo/stacked-120.png',
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
        width={v.width}
        height={v.intrinsicHeight}
        // The lockup is the accessible name of the link that wraps it, so this
        // carries real alt text rather than an empty string.
        className={`${v.height} w-auto ${className}`}
        decoding="async"
      />
    </picture>
  )
}
