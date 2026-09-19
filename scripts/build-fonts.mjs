/**
 * Archivo font pipeline. Fetches the upstream faces from Google, narrows the
 * variation axes to the range this site actually uses, and writes the result to
 * public/fonts.
 *
 *   npm run fonts          (or: node scripts/build-fonts.mjs)
 *
 * Run by hand, like scripts/optimize-media.mjs, and the output is committed.
 * The build never touches the network.
 *
 *   writes        public/fonts/archivo-{latin,latin-ext,vietnamese}.woff2
 *   consumed by   src/styles/fonts.css
 *   axis ranges   wght 400-700, wdth 100-118   (see AXES below)
 *
 * WHEN TO RE-RUN THIS
 *
 * Nothing calls it automatically, so it will not notice on its own:
 *
 *   - A new weight or width appears in the CSS. Anything outside the ranges in
 *     AXES is silently clamped by the browser to the nearest edge, so nothing
 *     visibly breaks, the type just stops getting wider or heavier than the
 *     bound. Widen AXES, re-run, and update the font-weight / font-stretch
 *     descriptors in src/styles/fonts.css to match.
 *   - Archivo is upgraded upstream, or a subset is added or dropped. Re-run and
 *     copy the unicode-range values printed at the end into fonts.css. Re-check
 *     the Archivo Fallback overrides in that file as well: they are measured
 *     against the default instance, which a new release could move.
 *
 * If you change AXES, re-check the two things that make this safe. First, that
 * the old axis defaults (wdth 100, wght 400) are still inside the new ranges:
 * instancing to a range that excludes them moves the default instance, which
 * changes the metrics the fallback face was measured against and puts CLS back
 * on the table. Second, that the family still covers the same code points; the
 * three faces together mapped 560 before and after this was first run.
 *
 * EXPECTED, NOT A BUG: instanced text lands within about 0.03% of the width it
 * had before. Partial instancing re-derives the variation store, and
 * interpolating inside a narrowed designspace rounds to font units slightly
 * differently than inside the full one. On a 70-character sample at 100px the
 * worst case was 1.27px on 4450px, at wdth 118, which is the setting furthest
 * from the axis default; the default itself is exact. At real sizes that is
 * under a tenth of a pixel, page heights are unchanged at every breakpoint on
 * every route, and CLS stays at 0. There is nothing here to fix.
 *
 * WHY THIS EXISTS
 *
 * Archivo is requested with its width axis, because the design uses it: every
 * heading sets an explicit wdth between 104 and 118 so the type reads wide and
 * structural. Carrying a second axis is what makes the file big. The latin face
 * Google serves is 88kb, against roughly 30kb for a comparable single-axis
 * face, and it sits on the critical path.
 *
 * The reason it is that big is that Google ships the whole designspace: weight
 * 100 to 900 and width 62% to 125%. The site reaches a small corner of that.
 * Narrowing the axes to the corner in use takes the latin face from 88kb to
 * 50kb with no change to any glyph or any instance the CSS can ask for.
 *
 * Google will not do this server side. Asking its API for a sub-range, as in
 *   fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..118,400..700
 * returns a different stylesheet but byte for byte the same 90,104 byte binary,
 * so the narrowing has to happen here.
 *
 * WHAT DETERMINES THE RANGES
 *
 * wdth 100 to 118. globals.css asks for 104, 108, 110 and 115; ContactBand and
 * the contact page ask for 112; not-found asks for 118. The lower bound is 100
 * rather than 104 because the bare `h1, h2, h3` rule sets the family without
 * setting a width, so anything that misses a u-* class renders at the axis
 * default, and that default must stay reachable.
 *
 * wght 400 to 700. globals.css asks for 600, 620, 650 and 700, and the same
 * bare-heading argument applies at the bottom: Tailwind's preflight resets
 * heading weight to inherit, so an unclassed heading lands on the body's 400.
 *
 * Both old defaults, wdth 100 and wght 400, are inside the new ranges. That is
 * load-bearing: instancing to a range that excluded them would move the default
 * instance, which would change the metrics next/font measured its fallback
 * against and put CLS back on the table.
 */
import subsetFont from 'subset-font'
import { decompress } from 'wawoff2'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = 'public/fonts'

/** A current desktop Chrome, so Google serves woff2 rather than a ttf. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

/**
 * The corner of the designspace the CSS can reach. Widening this is the whole
 * knob; see "WHEN TO RE-RUN THIS" above before you touch it, and keep
 * src/styles/fonts.css in step.
 */
const AXES = {
  wdth: { min: 100, max: 118 },
  wght: { min: 400, max: 700 },
}

/**
 * Subsets kept, with the unicode-range each is gated on.
 *
 * All three are kept deliberately. Only latin loads for English copy, and the
 * other two would be dead weight if they were in the same file, but they are
 * not: a unicode-range gate means a visitor only pays for a face when the page
 * contains a character inside it. Dropping them would save nothing on a normal
 * page load and would silently drop the accented characters to Arial the first
 * time anyone writes one.
 *
 * The ranges are copied from the stylesheet Google serves, which is also what
 * next/font emits today, so coverage is unchanged.
 */
const SUBSETS = ['latin', 'latin-ext', 'vietnamese']

/** Every code point in a unicode-range string, as literal characters. */
function charsFor(range) {
  const out = []
  for (const part of range.split(',')) {
    const m = part.trim().replace(/^U\+/i, '')
    if (m.includes('-')) {
      const [a, b] = m.split('-').map((h) => parseInt(h, 16))
      for (let c = a; c <= b; c++) out.push(String.fromCodePoint(c))
    } else if (m.includes('?')) {
      // A wildcard range such as 0?? means 000 to 0FF.
      const a = parseInt(m.replace(/\?/g, '0'), 16)
      const b = parseInt(m.replace(/\?/g, 'F'), 16)
      for (let c = a; c <= b; c++) out.push(String.fromCodePoint(c))
    } else {
      out.push(String.fromCodePoint(parseInt(m, 16)))
    }
  }
  return out.join('')
}

const kb = (n) => (n / 1024).toFixed(1) + 'kb'

async function main() {
  await mkdir(OUT, { recursive: true })

  // One request for the whole family, then the faces are picked apart by the
  // unicode-range comment Google writes above each @font-face block.
  const url =
    'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap'
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error('Google Fonts returned ' + res.status)
  const css = await res.text()

  // Blocks look like:  /* latin */\n@font-face {...src: url(...) ...unicode-range: ...;}
  const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g)]
  if (blocks.length === 0) throw new Error('could not parse the Google stylesheet')

  const faces = []
  let before = 0
  let after = 0

  for (const [, name, body] of blocks) {
    if (!SUBSETS.includes(name)) continue
    const src = body.match(/url\((https:[^)]+)\)/)?.[1]
    const range = body.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim()
    if (!src || !range) throw new Error('incomplete @font-face for ' + name)

    const woff2 = Buffer.from(
      await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer()
    )
    // harfbuzz wants an sfnt, and what Google serves is woff2-compressed.
    const sfnt = Buffer.from(await decompress(woff2))
    const out = await subsetFont(sfnt, charsFor(range), {
      targetFormat: 'woff2',
      variationAxes: AXES,
    })

    const file = path.join(OUT, `archivo-${name}.woff2`)
    await writeFile(file, out)
    faces.push({ name, file: `/fonts/archivo-${name}.woff2`, range })
    before += woff2.length
    after += out.length
    console.log(
      `  ${name.padEnd(10)} ${kb(woff2.length).padStart(8)} -> ${kb(out.length).padStart(8)}` +
        `   (${(100 - (out.length / woff2.length) * 100).toFixed(0)}% smaller)`
    )
  }

  console.log(`\n  total      ${kb(before)} -> ${kb(after)}`)
  console.log('\nunicode-ranges written, for src/styles/fonts.css:')
  for (const f of faces) console.log(`  ${f.name}: ${f.range}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
