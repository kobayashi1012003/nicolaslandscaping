'use client'

import { useEffect, useRef, useState } from 'react'
import { PauseIcon, PlayIcon } from '@phosphor-icons/react/dist/ssr'
import { posterSet, posterSrc, videoSrc, videoSrcSmall, videos, type VideoKey } from '@/lib/media'

type Props = {
  name: VideoKey
  sizes: string
  className?: string
  /** Hero clip. Its poster is the LCP image and is fetched at high priority. */
  eager?: boolean
  /**
   * Skip the video entirely on phones and show only the poster.
   *
   * Set on the hero, for two reasons. First, a video layered over the poster is
   * its own paint, so the browser treats the moment it appears as a new Largest
   * Contentful Paint candidate. Deferring the clip for bandwidth then pushed
   * measured LCP out past four seconds even though the poster itself was on
   * screen in well under a second. Second, half a megabyte of decorative loop on
   * someone's cellular data is a poor trade for a homeowner who came to find a
   * phone number.
   *
   * So on phones the hero is a photograph, and the motion is a larger-screen
   * enhancement. Clips further down the page are unaffected: they are never the
   * LCP element and they only load once scrolled to.
   */
  posterOnlyOnMobile?: boolean
}

/**
 * A muted, looping jobsite clip with an escape hatch.
 *
 * The poster is a real <picture>, layered underneath the video, rather than the
 * video's own `poster` attribute. That attribute takes a single URL, which means
 * a single format, so it was pulling the JPEG on every device and re-downloading
 * roughly 700kb across the page that the AVIF renditions already covered. A
 * picture element negotiates AVIF and WebP properly and makes the hero preload
 * in layout.tsx actually resolve to the file the browser uses.
 *
 * Loading is staged so nothing competes with the LCP image:
 *
 *   - The hero's video source is attached only after the window load event, so
 *     1.5mb of MP4 never contends with the poster it sits behind.
 *   - Below-the-fold clips attach their source when they approach the viewport.
 *   - Under prefers-reduced-motion no <video> is mounted at all and no video
 *     bytes are requested. The poster is the whole story.
 *
 * Silent autoplay with no way to stop it is a motion barrier, so there is always
 * a labelled pause control, playback stops when the clip scrolls out of view,
 * and once someone presses pause that choice is not quietly undone on scroll.
 */
export function VideoLoop({
  name,
  sizes,
  className,
  eager = false,
  posterOnlyOnMobile = false,
}: Props) {
  const entry = videos[name]
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const [reduced, setReduced] = useState<boolean | null>(null)
  const [narrow, setNarrow] = useState<boolean | null>(null)
  const [paused, setPaused] = useState(false)
  const [canLoad, setCanLoad] = useState(false)
  const [painted, setPainted] = useState(false)
  const pausedByUser = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!posterOnlyOnMobile) {
      setNarrow(false)
      return
    }
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [posterOnlyOnMobile])

  const showVideo = reduced === false && narrow === false

  // The hero waits for load so the poster wins the bandwidth race.
  useEffect(() => {
    if (!eager || !showVideo) return
    if (document.readyState === 'complete') {
      setCanLoad(true)
      return
    }
    const onLoad = () => setCanLoad(true)
    window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [eager, showVideo])

  // Everything else loads on approach and plays while visible.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || !showVideo) return

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setCanLoad(true)
        const v = videoRef.current
        if (!v) return
        if (e.isIntersecting) {
          if (!pausedByUser.current) void v.play().catch(() => {})
        } else {
          v.pause()
        }
      },
      { rootMargin: '250px 0px', threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [showVideo])

  // Start playing as soon as a source is attached, if we are on screen already.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !canLoad || pausedByUser.current) return
    void v.play().catch(() => {})
  }, [canLoad])

  function toggle() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      pausedByUser.current = false
      void v.play().catch(() => {})
      setPaused(false)
    } else {
      pausedByUser.current = true
      v.pause()
      setPaused(true)
    }
  }

  return (
    <div ref={wrapRef} className={`u-media ${className ?? ''}`}>
      {/* Poster layer. Also the permanent fallback if video never plays. */}
      <picture>
        <source type="image/avif" srcSet={posterSet(entry.src, 'avif')} sizes={sizes} />
        <source type="image/webp" srcSet={posterSet(entry.src, 'webp')} sizes={sizes} />
        <img
          src={posterSrc(entry.src)}
          srcSet={posterSet(entry.src, 'jpg')}
          sizes={sizes}
          alt={entry.alt}
          width={1080}
          height={1440}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'low'}
          decoding={eager ? 'sync' : 'async'}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>

      {showVideo && (
        <>
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            width={1080}
            height={1440}
            // The poster above carries the description for assistive tech; the
            // video itself is decorative repetition of it.
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setPainted(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              painted ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Order matters: the browser takes the first source whose media
                query matches, so the phone encode has to come first. */}
            {canLoad ? (
              <>
                <source
                  src={videoSrcSmall(entry.src)}
                  type="video/mp4"
                  media="(max-width: 767px)"
                />
                <source src={videoSrc(entry.src)} type="video/mp4" />
              </>
            ) : null}
          </video>

          <button
            type="button"
            onClick={toggle}
            aria-label={paused ? `Play the clip: ${entry.alt}` : `Pause the clip: ${entry.alt}`}
            className="absolute bottom-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-ink/55 text-white backdrop-blur-sm transition-colors hover:bg-ink/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {paused ? (
              <PlayIcon size={18} weight="fill" aria-hidden />
            ) : (
              <PauseIcon size={18} weight="fill" aria-hidden />
            )}
          </button>
        </>
      )}
    </div>
  )
}
