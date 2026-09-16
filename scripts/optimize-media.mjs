/**
 * Media pipeline. Reads ONLY from ./media-source (copies of the originals) and
 * writes to ./public/media. The originals in the Downloads folder are never touched.
 *
 *   node scripts/optimize-media.mjs
 *
 * Images  -> AVIF + WebP + JPEG fallback, several widths, 3:4 crop, EXIF stripped.
 * Videos  -> muted, trimmed, H.264 MP4, plus a graded poster frame.
 *
 * sharp does not copy metadata unless withMetadata() is called, so every output
 * here is free of EXIF and GPS by construction. These are customers' homes.
 */
import sharp from 'sharp'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const run = promisify(execFile)
const SRC = 'media-source'
const OUT = 'public/media'
const WIDTHS = [400, 640, 900, 1080]

/** One gentle grade applied to every photo so the set reads as a single shoot. */
const GRADE = { saturation: 0.93, brightness: 1.015 }
const CONTRAST = { mul: 1.06, add: -7 }

/** In and out points chosen by reviewing each clip frame by frame. */
const CLIPS = {
  hero: { start: 6.8, dur: 4.6, pingPong: true },
  cleanup: { start: 1.0, dur: 4.5, pingPong: false },
  trailer: { start: 5.0, dur: 4.0, pingPong: false },
  tree: { start: 7.0, dur: 2.7, pingPong: true },
  fencing: { start: 6.0, dur: 4.5, pingPong: false },
}

const kb = (b) => Math.round(b / 1024) + 'kb'

async function sizeOf(p) {
  try {
    return (await stat(p)).size
  } catch {
    return 0
  }
}

function graded(pipeline) {
  return pipeline.modulate(GRADE).linear(CONTRAST.mul, CONTRAST.add)
}

async function buildImage(file) {
  const name = path.basename(file, path.extname(file))
  const dir = path.join(OUT, 'img')
  await mkdir(dir, { recursive: true })

  const meta = await sharp(file).metadata()
  const report = []
  const widths = []

  for (const w of WIDTHS) {
    // Never upscale past the source resolution.
    if (w > meta.width) continue
    const h = Math.round((w * 4) / 3)
    const base = graded(
      sharp(file).resize(w, h, { fit: 'cover', position: sharp.strategy.attention })
    )
    // These frames are dense with foliage and gravel, which is expensive to
    // encode. Step quality down at the large widths so even the WebP and JPEG
    // fallbacks stay under the 300kb budget.
    const q =
      w >= 1080 ? { avif: 48, webp: 56, jpg: 66 }
      : w >= 900 ? { avif: 48, webp: 64, jpg: 68 }
      : { avif: 52, webp: 74, jpg: 78 }
    const avif = path.join(dir, name + '-' + w + '.avif')
    const webp = path.join(dir, name + '-' + w + '.webp')
    const jpg = path.join(dir, name + '-' + w + '.jpg')
    await base.clone().avif({ quality: q.avif, effort: 6 }).toFile(avif)
    await base.clone().webp({ quality: q.webp }).toFile(webp)
    await base.clone().jpeg({ quality: q.jpg, mozjpeg: true }).toFile(jpg)
    widths.push(w)
    report.push(
      w + 'w ' + kb(await sizeOf(avif)) + '/' + kb(await sizeOf(webp)) + '/' + kb(await sizeOf(jpg))
    )
  }
  console.log('  ' + name + ': ' + report.join('  '))
  return { name, widths }
}

async function buildVideo(file) {
  const name = path.basename(file, path.extname(file))
  const cfg = CLIPS[name]
  if (!cfg) {
    console.log('  ' + name + ': no trim configured, skipped')
    return null
  }
  const dir = path.join(OUT, 'video')
  await mkdir(dir, { recursive: true })

  const mp4 = path.join(dir, name + '.mp4')
  const ss = String(cfg.start)
  const t = String(cfg.dur)

  // A slow camera pan hard-cutting back to its first frame reads as a glitch.
  // Ping-pong plays the segment forward then reversed, so the loop has no seam.
  const vf = cfg.pingPong
    ? 'split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,format=yuv420p'
    : 'format=yuv420p'

  // H.264 only, deliberately. A VP9 WebM was built alongside this at first and
  // came out consistently LARGER than the H.264 at matched quality on this
  // 720x960 handheld footage. Since browsers pick the first source they can
  // play, shipping it would have made the page heavier for most visitors for no
  // gain. H.264 baseline/main in MP4 plays everywhere that matters.
  //
  // -an drops audio entirely: nothing on these clips is worth hearing, and a
  // silent track keeps files small and satisfies mobile autoplay policy.
  await run('ffmpeg', [
    '-v', 'error', '-y', '-ss', ss, '-t', t, '-i', file,
    '-an', '-vf', vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
    '-profile:v', 'main', '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
    mp4,
  ])

  // A second, lighter encode for phones. The full file is around 1.5mb, which
  // is a lot of someone's cellular data for a decorative loop behind a poster
  // they can already see. Half width and a looser CRF cuts it by roughly two
  // thirds and is indistinguishable at phone size.
  const mp4Sm = path.join(dir, name + '-sm.mp4')
  await run('ffmpeg', [
    '-v', 'error', '-y', '-ss', ss, '-t', t, '-i', file,
    '-an', '-vf', vf + ',scale=480:-2',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '32',
    '-profile:v', 'main', '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
    mp4Sm,
  ])

  // The poster gets the same grade as the stills so nothing shifts on play.
  const rawPoster = path.join(dir, name + '-poster-raw.png')
  await run('ffmpeg', ['-v', 'error', '-y', '-ss', ss, '-i', file, '-frames:v', '1', rawPoster])
  for (const w of [640, 800, 1080]) {
    const h = Math.round((w * 4) / 3)
    const base = graded(
      sharp(rawPoster).resize(w, h, { fit: 'cover', position: sharp.strategy.attention })
    )
    await base.clone().avif({ quality: 42, effort: 7 }).toFile(path.join(dir, name + '-poster-' + w + '.avif'))
    await base.clone().webp({ quality: 72 }).toFile(path.join(dir, name + '-poster-' + w + '.webp'))
    await base.clone().jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(dir, name + '-poster-' + w + '.jpg'))
  }
  await unlink(rawPoster)

  console.log(
    '  ' + name + ': mp4 ' + kb(await sizeOf(mp4)) + ' / sm ' + kb(await sizeOf(mp4Sm)) +
    '  (' + cfg.start + 's +' + cfg.dur + 's' + (cfg.pingPong ? ', ping-pong' : '') + ')'
  )
  return name
}

async function buildLogo() {
  const dir = path.join(OUT, 'logo')
  await mkdir(dir, { recursive: true })
  const src = path.join(SRC, 'logo', 'logo-full.png')

  // Isolate the mark: take the upper band of the 2000x2000 lockup, above the
  // wordmark, then trim the surrounding transparency so it sits flush.
  //
  // This must be two passes. sharp applies trim() before extract() inside a
  // single pipeline no matter what order you call them in, which would trim the
  // canvas down and then put the extract region out of bounds.
  const band = await sharp(src)
    .extract({ left: 0, top: 0, width: 2000, height: 900 })
    .png()
    .toBuffer()
  const markBuf = await sharp(band).trim().png().toBuffer()
  const m = await sharp(markBuf).metadata()
  console.log('  mark trimmed to ' + m.width + 'x' + m.height)

  for (const h of [48, 96, 144]) {
    await sharp(markBuf).resize({ height: h }).png({ compressionLevel: 9 }).toFile(path.join(dir, 'mark-' + h + '.png'))
    await sharp(markBuf).resize({ height: h }).webp({ quality: 92 }).toFile(path.join(dir, 'mark-' + h + '.webp'))
  }

  // Square, padded icons for favicon and apple-touch.
  const side = Math.max(m.width, m.height)
  const pad = Math.round(side * 0.14)
  const inner = await sharp(markBuf)
    .resize({ width: side, height: side, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  const square = await sharp({
    create: {
      width: side + pad * 2,
      height: side + pad * 2,
      channels: 4,
      background: { r: 252, g: 252, b: 251, alpha: 1 },
    },
  })
    .composite([{ input: inner, left: pad, top: pad }])
    .png()
    .toBuffer()

  for (const s of [32, 180, 192, 512]) {
    await sharp(square).resize(s, s).png({ compressionLevel: 9 }).toFile(path.join('public', 'icon-' + s + '.png'))
  }
  console.log('  icons: 32 / 180 / 192 / 512')
}

async function buildOg() {
  // Open Graph card from the strongest real project photo, cropped to 1.91:1.
  const src = path.join(SRC, 'photos', 'work-crew-border.jpg')
  await graded(sharp(src).resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention }))
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join('public', 'og.jpg'))
  console.log('  og.jpg 1200x630 ' + kb(await sizeOf('public/og.jpg')))
}

async function main() {
  await mkdir(OUT, { recursive: true })

  console.log('\nPhotos')
  const photoDir = path.join(SRC, 'photos')
  const photos = []
  for (const f of (await readdir(photoDir)).sort()) {
    photos.push(await buildImage(path.join(photoDir, f)))
  }

  console.log('\nVideo')
  const videoDir = path.join(SRC, 'video')
  for (const f of (await readdir(videoDir)).sort()) {
    await buildVideo(path.join(videoDir, f))
  }

  console.log('\nLogo')
  await buildLogo()

  console.log('\nOpen Graph')
  await buildOg()

  await writeFile(
    path.join(OUT, 'manifest.json'),
    JSON.stringify({ widths: WIDTHS, photos, generated: new Date().toISOString() }, null, 2)
  )
  console.log('\nDone. All outputs are free of EXIF and GPS data.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
