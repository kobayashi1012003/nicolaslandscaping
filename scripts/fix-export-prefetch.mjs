/**
 * Post-build fix for a Next 16 static-export path bug.
 *
 * The App Router client prefetches a route's RSC segment payload from a DOTTED
 * path:
 *
 *   /services/__next.services.__PAGE__.txt
 *
 * but `output: 'export'` writes that payload into a DIRECTORY instead:
 *
 *   out/services/__next.services/__PAGE__.txt
 *
 * The two shapes never meet, so every nested route 404s on prefetch. Navigation
 * still works, because the router falls back to a normal request, but each page
 * load logs console errors and burns a pointless round trip. Only nested routes
 * are affected; the home route's payload is already flat, which is why the bug
 * is easy to miss.
 *
 * This copies each payload to the flat name the client actually asks for. The
 * nested copies are left alone so nothing breaks if a future Next release
 * starts resolving them, or fixes the emit and makes this a no-op.
 *
 * Remove once the upstream emit matches the request path.
 */
import { readdir, copyFile, stat } from 'node:fs/promises'
import path from 'node:path'

const ROOT = 'out'

async function walk(dir) {
  let copied = 0
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (!entry.isDirectory()) continue

    if (entry.name.startsWith('__next.')) {
      for (const inner of await readdir(full, { withFileTypes: true })) {
        if (!inner.isFile()) continue
        const flat = path.join(dir, `${entry.name}.${inner.name}`)
        await copyFile(path.join(full, inner.name), flat)
        console.log('  ' + flat.replace(/\\/g, '/'))
        copied += 1
      }
    } else {
      copied += await walk(full)
    }
  }
  return copied
}

try {
  await stat(ROOT)
} catch {
  console.error(`No ${ROOT}/ directory. Run next build first.`)
  process.exit(1)
}

const n = await walk(ROOT)
console.log(n === 0 ? 'Prefetch paths: nothing to fix.' : `Prefetch paths: wrote ${n} flat payload(s).`)
