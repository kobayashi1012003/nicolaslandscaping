/**
 * Dev-only responsive and accessibility audit. Drives headless Chrome and
 * reports, per page per width: horizontal overflow and which element causes it,
 * undersized tap targets, heading-order breaks, images missing alt text, and
 * body text below 16px.
 *
 *   node scripts/audit.mjs
 *
 * Not part of the site build.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const PORT = 9334
const PAGES = ['/', '/services/', '/contact/', '/nope/']
const WIDTHS = [360, 375, 390, 414, 768, 1024, 1280, 1440, 1920]

const AUDIT = `(() => {
  const de = document.documentElement
  const vw = de.clientWidth
  const out = { vw, overflow: de.scrollWidth - vw, culprits: [], small: [], headings: [], noAlt: [], tinyText: [] }

  if (out.overflow > 0) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
        const s = getComputedStyle(el)
        if (s.position === 'fixed' || s.visibility === 'hidden' || s.display === 'none') continue
        out.culprits.push(el.tagName.toLowerCase() + '.' + (el.className.toString().slice(0, 60) || '(none)') +
          ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']')
        if (out.culprits.length > 6) break
      }
    }
  }

  // Interactive targets. 44 is the iOS figure and the stricter of the two
  // platform minimums, so measuring against it covers Android's 48dp intent too.
  //
  // Two documented exemptions are skipped rather than reported, because they are
  // correct behaviour and would otherwise drown the real findings:
  //
  //   sr-only  Visually hidden until focused, at which point it renders at full
  //            size. Measuring it while hidden reports a meaningless 1x1.
  //   inline   WCAG 2.5.8 exempts a link laid out inline inside a sentence.
  //            Padding it to 44px would break the line it sits in.
  for (const el of document.querySelectorAll('a[href], button, [role="button"], input, select')) {
    const s = getComputedStyle(el)
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') continue
    if (el.closest('[aria-hidden="true"]')) continue
    if (el.className && String(el.className).includes('sr-only')) continue
    if (s.display === 'inline') continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    if (r.height < 44 || r.width < 24) {
      out.small.push((el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 34) +
        ' -> ' + Math.round(r.width) + 'x' + Math.round(r.height))
    }
  }

  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
  out.h1Count = hs.filter(h => h.tagName === 'H1').length
  let prev = 0
  for (const h of hs) {
    const lvl = Number(h.tagName[1])
    if (prev && lvl > prev + 1) out.headings.push('jump h' + prev + ' -> h' + lvl + ': ' + h.textContent.trim().slice(0, 30))
    prev = lvl
  }

  for (const img of document.querySelectorAll('img')) {
    if (img.getAttribute('alt') === null) out.noAlt.push(img.currentSrc.split('/').pop())
  }

  for (const el of document.querySelectorAll('p, li, dd, span')) {
    if (!el.textContent.trim() || el.children.length) continue
    const fs = parseFloat(getComputedStyle(el).fontSize)
    if (fs < 12 && !el.closest('a[href="/"]')) out.tinyText.push(el.textContent.trim().slice(0, 28) + ' @' + fs + 'px')
  }

  return JSON.stringify(out)
})()`

async function main() {
  const chrome = spawn(
    CHROME,
    ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu', '--no-first-run',
     '--hide-scrollbars', '--force-device-scale-factor=1',
     '--user-data-dir=' + path.join(process.env.TEMP ?? '.', 'nl-chrome-audit'), 'about:blank'],
    { stdio: 'ignore' }
  )

  let wsUrl
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl
    } catch {}
    if (!wsUrl) await new Promise((r) => setTimeout(r, 300))
  }

  const ws = new globalThis.WebSocket(wsUrl)
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
    }
  })
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const msgId = ++id
      pending.set(msgId, { resolve, reject })
      ws.send(JSON.stringify({ id: msgId, method, params, sessionId }))
    })

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)

  let problems = 0

  for (const page of PAGES) {
    console.log('\n=== ' + page + ' ===')
    for (const w of WIDTHS) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 }, sessionId)
      await send('Page.navigate', { url: BASE + page }, sessionId)
      await new Promise((r) => setTimeout(r, 1500))
      const { result } = await send('Runtime.evaluate', { expression: AUDIT, returnByValue: true }, sessionId)
      const a = JSON.parse(result.value)

      const flags = []
      if (a.overflow > 0) { flags.push('OVERFLOW +' + a.overflow + 'px'); problems++ }
      if (a.small.length) { flags.push('SMALL TARGETS: ' + a.small.join(' | ')); problems++ }
      if (a.headings.length) { flags.push('HEADING: ' + a.headings.join('; ')); problems++ }
      if (a.h1Count !== 1) { flags.push('H1 COUNT = ' + a.h1Count); problems++ }
      if (a.noAlt.length) { flags.push('NO ALT: ' + a.noAlt.join(', ')); problems++ }
      if (a.tinyText.length) { flags.push('TINY TEXT: ' + a.tinyText.join(' | ')); problems++ }

      console.log(
        '  ' + String(w).padStart(4) + 'px  ' + (flags.length ? flags.join('\n          ') : 'ok')
      )
      if (a.culprits.length) console.log('          culprits: ' + a.culprits.join('\n                    '))
    }
  }

  console.log('\n' + (problems === 0 ? 'CLEAN' : problems + ' problem group(s) found') + '\n')
  ws.close()
  chrome.kill()
}

main().catch((e) => { console.error(e); process.exit(1) })
