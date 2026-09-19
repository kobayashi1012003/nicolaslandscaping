/**
 * Media registry.
 *
 * Every entry points at files produced by scripts/optimize-media.mjs. Alt text
 * lives here rather than in the components so that a single edit updates the
 * description everywhere an asset appears.
 *
 * Alt text describes the WORK in the frame, which is what a visitor needs and
 * what a search engine can use. It is never the filename and never decorative
 * filler.
 */

/**
 * Rendition ladder. Must stay in step with WIDTHS in scripts/optimize-media.mjs.
 *
 * The rungs are chosen so the browser lands close to what it actually needs
 * rather than rounding up hard. The two that matter most on a phone:
 *
 *   320  a gallery thumbnail is 178 CSS px in the two-column grid, which is
 *        311 device px at the 1.75x Lighthouse emulates. The old ladder started
 *        at 400 and overshot every one of them.
 *   720  a full-width image is 372 CSS px, or 651 device px at 1.75x, which
 *        cleared 640 by eleven pixels and fell all the way through to 900.
 */
export const IMAGE_WIDTHS = [240, 320, 400, 560, 640, 720, 900, 1080] as const

/** Poster ladder. See POSTER_WIDTHS in scripts/optimize-media.mjs. */
export const POSTER_WIDTHS = [240, 320, 400, 560, 640, 720, 800, 1080] as const

export type ImageKey = keyof typeof images

export const images = {
  crewBorder: {
    src: 'work-crew-border',
    alt: 'A crew member laying a cut stone border along a curbside planting bed, with fresh shrubs and a gravel drainage channel already in place.',
  },
  borderFinished: {
    src: 'work-border-finished',
    alt: 'A finished cut stone border running beside a gravel strip, with newly planted shrubs along a residential fence line.',
  },
  borderProgress: {
    src: 'work-border-progress',
    alt: 'Stone edging part way through installation, with a wheelbarrow and fresh plants staged along the bed.',
  },
  gravelChannel: {
    src: 'work-gravel-channel',
    alt: 'A gravel drainage channel set between a stone edge and a fence line, graded to carry runoff away from the planting bed.',
  },
  fencingBefore: {
    src: 'fencing-before',
    alt: 'The original weathered white timber fence and gate enclosing a narrow concrete side yard, before replacement.',
  },
} as const

export type VideoKey = keyof typeof videos

export const videos = {
  hero: {
    src: 'hero',
    alt: 'A slow pan along a completed cut stone border, roughly twenty seven feet of it, edging a freshly planted front yard.',
  },
  cleanup: {
    src: 'cleanup',
    alt: 'A curved stone retaining wall and the cleared planting bed behind it after overgrowth was taken out.',
  },
  trailer: {
    src: 'trailer',
    alt: 'A pickup and work trailer parked at the kerb beside an overgrown strip waiting to be cleared.',
  },
  tree: {
    src: 'tree',
    alt: 'A mature broadleaf tree overhanging a fence line, with a heavy low limb across the frame.',
  },
  fencing: {
    src: 'fencing',
    alt: 'The completed white vinyl fence line running along the side of the house that replaced the old timber fence.',
  },
} as const

const IMG = '/media/img'
const VID = '/media/video'

/** srcset string for one format of a registered image. */
export function srcSet(name: string, ext: 'avif' | 'webp' | 'jpg') {
  return IMAGE_WIDTHS.map((w) => `${IMG}/${name}-${w}.${ext} ${w}w`).join(', ')
}

/** Largest rendition, used as the <img src> fallback. */
export function fallbackSrc(name: string) {
  return `${IMG}/${name}-1080.jpg`
}

export function posterSet(name: string, ext: 'avif' | 'webp' | 'jpg') {
  return POSTER_WIDTHS.map((w) => `${VID}/${name}-poster-${w}.${ext} ${w}w`).join(', ')
}

export function posterSrc(name: string) {
  return posterLargest(name, 'jpg')
}

/**
 * Largest poster rendition in one format.
 *
 * The preload in the home page needs this in AVIF, to pair with the AVIF
 * srcset. Deriving it from the ladder rather than writing the width out means a
 * change to POSTER_WIDTHS cannot leave a preload pointing at a file the build
 * no longer produces.
 */
export function posterLargest(name: string, ext: 'avif' | 'webp' | 'jpg') {
  return `${VID}/${name}-poster-${POSTER_WIDTHS[POSTER_WIDTHS.length - 1]}.${ext}`
}

export function videoSrc(name: string) {
  return `${VID}/${name}.mp4`
}

/** Half-width encode served to phones, roughly a third of the full file. */
export function videoSrcSmall(name: string) {
  return `${VID}/${name}-sm.mp4`
}

// The services index used to raise a preview still on hover, and this is where
// the map from a service to its 640-wide frame lived. The feature is gone at the
// client's request, so the map went with it. The frames themselves are still
// shipped and still used, as video posters and as images on /services.
