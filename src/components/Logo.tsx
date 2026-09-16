/**
 * Horizontal lockup: the client's mark, untouched, beside the name set in the
 * site's display face.
 *
 * The supplied logo is a stacked lockup (mark sitting above the wordmark). At a
 * sane header height that renders the wordmark at roughly 20px, which is not the
 * "large logo" the brief asks for. Placing the mark beside typeset text keeps
 * the artwork exactly as drawn while letting the name read at a real size.
 */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <picture>
        <source type="image/webp" srcSet="/media/logo/mark-96.webp 2x, /media/logo/mark-48.webp 1x" />
        <img
          src="/media/logo/mark-96.png"
          srcSet="/media/logo/mark-144.png 2x, /media/logo/mark-96.png 1x"
          alt=""
          width={826}
          height={372}
          className="h-[26px] w-auto sm:h-[30px]"
          decoding="sync"
        />
      </picture>
      <span className="flex flex-col leading-none">
        <span
          className="font-display text-ink"
          style={{
            fontVariationSettings: "'wdth' 118, 'wght' 700",
            fontSize: 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)',
            letterSpacing: '-0.015em',
          }}
        >
          Nicolas
        </span>
        {/* Floor of 10px. Below that the tracked-out caps stop being readable,
            and the audit was measuring this at 8px on phones. */}
        <span
          className="text-ink-soft"
          style={{
            fontSize: 'clamp(0.625rem, 0.59rem + 0.14vw, 0.6875rem)',
            letterSpacing: '0.24em',
            marginTop: '0.24em',
            fontWeight: 500,
          }}
        >
          LANDSCAPING
        </span>
      </span>
    </span>
  )
}
