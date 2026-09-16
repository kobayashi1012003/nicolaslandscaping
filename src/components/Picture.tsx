import { fallbackSrc, images, srcSet, type ImageKey } from '@/lib/media'

type Props = {
  name: ImageKey
  /** Matches the CSS width the image actually renders at, per breakpoint. */
  sizes: string
  className?: string
  /** Set on the LCP image only. Everything else stays lazy. */
  priority?: boolean
  /** Override the registry alt, e.g. when the same frame is used to make a different point. */
  alt?: string
}

/**
 * Responsive <picture> over the pre-built AVIF / WebP / JPEG renditions.
 *
 * This is deliberately not next/image. The site is a static export, where the
 * Next image optimiser silently does nothing, and every rendition here is
 * already generated at build time by scripts/optimize-media.mjs. Hand-rolling
 * the element means the exact same bytes ship from any host.
 *
 * width and height are always present so the browser reserves the box before
 * the bytes land. All media is 3:4, hence 1080x1440.
 */
export function Picture({ name, sizes, className, priority = false, alt }: Props) {
  const entry = images[name]
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(entry.src, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(entry.src, 'webp')} sizes={sizes} />
      <img
        src={fallbackSrc(entry.src)}
        srcSet={srcSet(entry.src, 'jpg')}
        sizes={sizes}
        alt={alt ?? entry.alt}
        width={1080}
        height={1440}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        // Below-the-fold media is explicitly deprioritised rather than left on
        // 'auto'. Chrome's lazy-loading threshold is generous enough that the
        // gallery images start downloading during the LCP window and share the
        // connection with it; 'low' makes them yield instead.
        fetchPriority={priority ? 'high' : 'low'}
        // async, not sync. A synchronous decode of an 800x1067 AVIF runs on the
        // main thread, and under Lighthouse mobile throttling that is measurable
        // render delay on the one image that must paint first.
        decoding="async"
      />
    </picture>
  )
}
