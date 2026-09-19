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
 * Width descriptors, not density descriptors.
 *
 * These used to be written as `1x, 2x, 3x` against a ladder exported at
 * 80/120/180px tall. The trouble is that a density descriptor says nothing
 * about how big the element is: it only claims "this file is right for a
 * display of density N". The header lockup renders 225 CSS px wide on a phone,
 * so its true 1x is 225px of artwork, but the rung labelled 1x was 391px wide.
 * Every density was carrying roughly 1.7x more pixels than the box could use,
 * and a 2x phone — most phones — pulled 587px of lockup for a 450px need.
 *
 * With `w` descriptors plus a sizes list the browser does that arithmetic
 * itself, against the real rendered width, at whatever density it actually has.
 * The rungs below are chosen so that no display gets fewer pixels than it did
 * before: at 3x both variants still resolve to the largest file, and at 2x the
 * header drops one rung to a file that is still comfortably above 2x its box.
 *
 * sizes is written in px because these boxes are fixed by the height utility
 * and the artwork's aspect ratio, not by the viewport.
 */
const VARIANTS = {
  header: {
    height: 'h-[46px] sm:h-[54px]',
    width: 2128,
    intrinsicHeight: 435,
    // 46px tall renders 225 wide, 54px tall renders 264 wide.
    sizes: '(min-width: 640px) 264px, 225px',
    webp: '/media/logo/lockup-56.webp 274w, /media/logo/lockup-80.webp 391w, /media/logo/lockup-100.webp 489w, /media/logo/lockup-120.webp 587w, /media/logo/lockup-180.webp 881w',
    png: '/media/logo/lockup-56.png 274w, /media/logo/lockup-80.png 391w, /media/logo/lockup-100.png 489w, /media/logo/lockup-120.png 587w, /media/logo/lockup-180.png 881w',
    fallback: '/media/logo/lockup-120.png',
  },
  footer: {
    height: 'h-[104px] sm:h-[120px]',
    width: 1423,
    intrinsicHeight: 758,
    // 104px tall renders 195 wide, 120px tall renders 225 wide.
    sizes: '(min-width: 640px) 225px, 195px',
    webp: '/media/logo/stacked-104.webp 195w, /media/logo/stacked-120.webp 225w, /media/logo/stacked-200.webp 375w, /media/logo/stacked-240.webp 451w, /media/logo/stacked-360.webp 676w',
    png: '/media/logo/stacked-104.png 195w, /media/logo/stacked-120.png 225w, /media/logo/stacked-200.png 375w, /media/logo/stacked-240.png 451w, /media/logo/stacked-360.png 676w',
    fallback: '/media/logo/stacked-240.png',
  },
} as const

export function Logo({ className = '', size = 'header' }: Props) {
  const v = VARIANTS[size]
  return (
    <picture>
      <source type="image/webp" srcSet={v.webp} sizes={v.sizes} />
      <img
        src={v.fallback}
        srcSet={v.png}
        sizes={v.sizes}
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
