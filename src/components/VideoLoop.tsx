'use client'

import { useEffect, useRef, useState } from 'react'
import { PauseIcon, PlayIcon } from '@phosphor-icons/react/dist/ssr'
import { posterSet, posterSrc, videoSrc, videos, type VideoKey } from '@/lib/media'

type Props = {
  name: VideoKey
  sizes: string
  className?: string
  /** Hero clip loads straight away. Everything else waits until it is near the viewport. */
  eager?: boolean
}

/**
 * A muted, looping jobsite clip with an escape hatch.
 *
 * Silent autoplay with no way to stop it is a motion barrier, so this does four
 * things a bare <video autoplay loop> does not:
 *
 *   1. Under prefers-reduced-motion the video element is never mounted at all.
 *      The poster renders as a still image and no video bytes are requested.
 *   2. An always-present pause control, labelled for screen readers.
 *   3. Playback stops when the clip scrolls out of view, so off-screen clips are
 *      not burning decode time and battery.
 *   4. Below-the-fold clips do not fetch until they are close to the viewport.
 *
 * Once a visitor presses pause, that choice is respected. The intersection
 * observer will not quietly restart it when they scroll back.
 */
export function VideoLoop({ name, sizes, className, eager = false }: Props) {
  const entry = videos[name]
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const [reduced, setReduced] = useState<boolean | null>(null)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(eager)
  const pausedByUser = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Load when near the viewport, play when actually visible.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || reduced !== false) return

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true)
        const v = videoRef.current
        if (!v) return
        if (e.isIntersecting) {
          if (!pausedByUser.current) void v.play().catch(() => {})
        } else {
          v.pause()
        }
      },
      { rootMargin: '200px 0px', threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

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

  const poster = (
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
        fetchPriority={eager ? 'high' : 'auto'}
        decoding={eager ? 'sync' : 'async'}
      />
    </picture>
  )

  return (
    <div ref={wrapRef} className={`u-media ${className ?? ''}`}>
      {/* Until the media query resolves, and always under reduced motion, the
          poster is the whole story. No layout shift either way: both are 3:4. */}
      {reduced !== false ? (
        poster
      ) : (
        <>
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            autoPlay={eager}
            preload={eager ? 'auto' : 'none'}
            poster={posterSrc(entry.src)}
            width={1080}
            height={1440}
            aria-label={entry.alt}
            className="h-full w-full object-cover"
          >
            {inView ? <source src={videoSrc(entry.src)} type="video/mp4" /> : null}
          </video>

          <button
            type="button"
            onClick={toggle}
            aria-label={paused ? 'Play this clip' : 'Pause this clip'}
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
