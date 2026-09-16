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
        // fetchPriority high on the hero pulls it ahead of the video request.
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
      />
    </picture>
  )
}
