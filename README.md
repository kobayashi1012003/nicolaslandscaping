# Nicolas Landscaping

Marketing site for Nicolas Landscaping, a service-area landscaping business in San Diego, CA.

The whole site exists to answer three questions a homeowner has on their phone in
under ten seconds: what they do, whether the work is any good, and how to reach
them right now. Anything that did not serve one of those was cut.

## Stack

| | |
|---|---|
| Framework | Next.js 16, App Router, static export (`output: 'export'`) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, design tokens as CSS variables |
| Smooth scroll | Lenis |
| Animation | Motion (`motion/react`) |
| Icons | Phosphor |
| Media | sharp (images), ffmpeg (video) |

Fonts are Archivo (display, with its width axis) and Instrument Sans (body),
self-hosted via `next/font`.

### Why not `next/image`

The build is a static export, where Next's runtime image optimiser does nothing.
Every rendition is generated ahead of time by the media script instead, and
`src/components/Picture.tsx` emits a plain `<picture>` with real `srcset`. The
same bytes ship from any host, with no server involved.

## Running it

```bash
npm install
npm run dev
```

Production build, output lands in `out/`:

```bash
npm run build
```

Serve that build locally:

```bash
npm start
```

## Updating the business information

**Everything lives in one file: `src/lib/business.ts`.** Phone number, Instagram,
service area, the service list and their one-line descriptions. Nothing else
needs touching.

### Launch flags

Two flags in that file matter:

```ts
siteUrl: 'https://nicolaslandscapingsd.com',
indexable: true,
```

Both are now set for the live domain. `robots.txt` allows, the sitemap is
published and no page carries `noindex`.

`indexable` was deliberately false for as long as the site answered only on a
throwaway host, because pages indexed there do not vanish when the real domain
arrives; they linger in results and compete with the real site for the same local
searches. If the site is ever moved to a staging host again, set it back to false
and the three of those revert together.

**Still outstanding:** the Cloudflare deploy also answers on a `workers.dev`
address, and that is exactly the kind of host the flag existed to protect
against. Canonical tags point at the real domain, but disabling the workers.dev
route in the Worker's settings is what actually keeps it out of the index.

### Copy still needing the owner's confirmation

Search `src/lib/business.ts` for these. They are marked in comments.

- **Service with Trailer** - the current line reflects a best guess, not
  Nicolas's own words.
- **Construction** - on the logo lockup, but no build work is evidenced in the
  footage, so the line is deliberately broad.
- The other service descriptions - standard wording for the trade, not quoted
  from him.

Anything genuinely unknown is `null`, and the UI omits that element rather than
inventing something. Keep it that way.

## Updating the media

Originals live outside this repo and are never modified. Copies go in
`media-source/`, which is gitignored so unoptimised files never get committed.

```
media-source/
  photos/    3:4 stills
  video/     source clips
  logo/      logo-horizontal.png  (header and footer lockup)
             logo-full.png        (stacked lockup, used only to cut the square icons)
```

Then:

```bash
npm run media
```

That writes to `public/media/` and handles:

- AVIF + WebP + JPEG at four widths, cropped 3:4 with sharp's attention crop
- One gentle colour grade across every photo so the set reads as a single shoot
- **EXIF and GPS stripped from everything** - these are customers' homes
- Video trimmed, muted, encoded to H.264 MP4, with a graded poster frame
- The horizontal lockup trimmed to its ink and exported at four heights, plus
  favicons cut from the mark and the Open Graph card

Trim points per clip are in the `CLIPS` map at the top of
`scripts/optimize-media.mjs`. To use a different part of a clip, change `start`
and `dur` and re-run.

New photos need an entry in `src/lib/media.ts` with **real alt text describing
the work in the frame**. That is what a visitor using a screen reader gets and
what a search engine can read.

## Dev-only scripts

None of these are part of the build. All need the dev server running and Chrome
at the path set at the top of each file.

```bash
node scripts/audit.mjs           # overflow, tap targets, heading order, alt text, across 9 widths
node scripts/interact-check.mjs  # mobile menu, scroll lock, sticky bar, deep links, reduced motion
node scripts/shots.mjs <outDir> <WxH[,WxH]> <path>   # headless screenshots
```

`scripts/fix-export-prefetch.mjs` **is** part of the build (`npm run build` runs
it after `next build`). It works around a Next 16 static-export bug: the client
prefetches a route's RSC payload from a dotted path
(`/services/__next.services.__PAGE__.txt`) but the export writes it into a
directory (`/services/__next.services/__PAGE__.txt`), so every nested route 404s
on prefetch. Delete the script once the upstream emit matches the request path.

## Deploying

Cloudflare Workers, from GitHub. Build `npm run build`, deploy
`npx wrangler deploy`.

`wrangler.jsonc` is what makes that work. Without a config in the repo, Wrangler
detects Next.js and runs the OpenNext migration, which looks for a server build
this site never produces and fails on a missing `pages-manifest.json`. The config
points at `out/` and declares no `"main"`, which is how Wrangler is told the build
is already just files.

Because the export is fully static it will also drop onto Netlify, Vercel, GitHub
Pages or any static host unchanged - apart from the response headers below, which
are written in Cloudflare's syntax and would need their own equivalent elsewhere.

### HTTP headers

`public/_headers` carries them. Everything in `public/` copies into `out/` on
build, and Cloudflare reads the file from the assets directory at deploy time.

- `/*` - `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`.
- `/_next/static/*` - `public, max-age=31536000, immutable`. Content-hashed, so
  the filename changes whenever the bytes do and the long cache is free.
- `/media/*` - `public, max-age=604800, must-revalidate`. Optimised by hand and
  not content-hashed, so a replaced photo keeping its filename would otherwise
  sit stale in caches for the full week.

Every matching rule contributes, so the `/*` block applies to the two cached
paths as well and only the `Cache-Control` differs between them.

`netlify.toml` used to carry these and was deleted along with Netlify. The rules
are the same; the syntax is not.

## Notes for whoever works on this next

- **Light theme only, deliberately.** The work is daylight photography against
  white, and the logo is built for a light surround. There is no dark mode.
- **Portrait media is the design, not a limitation.** Every photo and clip the
  business has is 3:4. The layouts are built around tall media on purpose.
- **No pricing anywhere.** No testimonials, ratings, years-in-business, licence
  or insurance claims either. None of it is verified, so none of it is on the
  site or in the structured data.
- Scroll reveals are server-rendered at `opacity: 0` by Motion, so a `<noscript>`
  rule in `layout.tsx` forces `[data-reveal]` visible when JS does not run.
  Keep it. `PageTransition` has the same hazard and is gated on `hydrated` for
  the same reason: passing an `initial` on first load put an inline `opacity: 0`
  on the whole page and blocked the largest paint for 217ms.
- **The hero is a still photograph on phones.** A video layered over the poster
  is a separate paint, so the browser treats its arrival as a new Largest
  Contentful Paint candidate, which pushed measured LCP past four seconds. It
  also saved half a megabyte of cellular data. Motion is a larger-screen
  enhancement; clips further down the page are unaffected.
- Clips autoplay muted but always have a pause control, stop when scrolled out
  of view, and are replaced by their poster under `prefers-reduced-motion`.
- **Fonts are deliberately not preloaded** (`preload: false` in `layout.tsx`).
  They were being fetched at High priority in the same instant as the hero
  poster and splitting the connection with it. The LCP element is an image, so
  the image gets the bandwidth.
- **One label per action.** "Call (619) 622-1735" and "Text us" everywhere there
  is room; "Call" / "Text" only in the sticky bar, where two buttons at 360px
  cannot fit the full labels. Do not introduce a third variant such as
  "Call now" or "Send a text". On the contact sections the display-size phone
  number *is* the call link, which is why there is no call button beside it.
- Anchor offsets come from one place: `scroll-padding-top` on `html` for native
  scrolling, and Lenis's `anchors.offset` for smooth scrolling. Adding
  `scroll-mt-*` to sections on top of those stacks a third offset and drops the
  target 200px down the page.

## A note on the logo

The header uses the client's **horizontal lockup**
(`media-source/logo/logo-horizontal.png`) and the footer uses the **stacked
lockup** (`logo-full.png`), both as supplied, so the real mark sits with the
real letterforms in both places.

Which lockup goes where is a question of the space available. The header is a
64-72px bar, so the wide artwork fits and renders at 46/54px. The footer has
vertical room, so the stacked lockup runs at 104/120px, where the
"LANDSCAPING | CONSTRUCTION" line is genuinely readable rather than texture.

Each variant declares its own intrinsic `width`/`height`, because the two
lockups are 4.89:1 and 1.88:1. Sharing one pair would reserve the wrong shape
before the image decodes, and cost the zero CLS.

Density descriptors are written per variant for the same reason. They are
relative to the element's rendered height, so one srcset tuned for the header
would hand the much larger footer an image at a fraction of the resolution it
needs on a 2x display, and the wordmark would go soft exactly where it is
largest.

The square favicons are cut from the mark at the top of the stacked lockup.

---

Website designed by [Le Design Studio](https://ledesign-studio.com/).
