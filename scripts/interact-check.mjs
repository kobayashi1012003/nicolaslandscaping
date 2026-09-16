/**
 * Dev-only interaction checks. Drives headless Chrome over CDP and asserts the
 * behaviours that a static audit cannot see: the mobile menu and its scroll
 * lock, keyboard dismissal, the sticky call bar's appear and hide rules, anchor
 * deep links clearing the fixed header, and the reduced-motion path.
 *
 *   node scripts/interact-check.mjs
 *
 * Needs the dev server running. Not part of the site build.
 */
import { spawn } from 'node:child_process'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const PORT = 9335

let pass = 0
let fail = 0
function check(label, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log('  PASS  ' + label + (detail ? '  (' + detail + ')' : ''))
  } else {
    fail += 1
    console.log('  FAIL  ' + label + (detail ? '  (' + detail + ')' : ''))
  }
}

async function main() {
  const chrome = spawn(
    CHROME,
    ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu', '--no-first-run',
     '--hide-scrollbars', '--force-device-scale-factor=1',
     '--user-data-dir=' + path.join(process.env.TEMP ?? '.', 'nl-chrome-interact'), 'about:blank'],
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
  const send = (method, params = {}, sid) =>
    new Promise((resolve, reject) => {
      const msgId = ++id
      pending.set(msgId, { resolve, reject })
      ws.send(JSON.stringify({ id: msgId, method, params, sessionId: sid }))
    })

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const S = sessionId
  await send('Page.enable', {}, S)
  await send('Runtime.enable', {}, S)

  const evalJs = async (expression, awaitPromise = false) => {
    const { result } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise }, S)
    return result.value
  }
  const goto = async (url, w = 390, h = 844) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 768 }, S)
    await send('Page.navigate', { url }, S)
    await new Promise((r) => setTimeout(r, 2200))
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  // ---- Mobile menu -------------------------------------------------------
  console.log('\nMobile menu (390x844)')
  await goto(BASE + '/')

  await evalJs(`document.querySelector('button[aria-controls="mobile-menu"]').click()`)
  await wait(700)
  let st = await evalJs(`JSON.stringify({
    expanded: document.querySelector('button[aria-controls="mobile-menu"]').getAttribute('aria-expanded'),
    bodyOverflow: document.body.style.overflow,
    panelHidden: document.getElementById('mobile-menu').getAttribute('aria-hidden'),
    panelX: Math.round(document.getElementById('mobile-menu').getBoundingClientRect().left)
  })`)
  let s = JSON.parse(st)
  check('opens on tap', s.expanded === 'true', 'aria-expanded=' + s.expanded)
  check('locks page scroll', s.bodyOverflow === 'hidden', 'body.overflow=' + (s.bodyOverflow || 'empty'))
  check('panel exposed to a11y tree', s.panelHidden === 'false', 'aria-hidden=' + s.panelHidden)
  check('panel slid into view', s.panelX === 0, 'left=' + s.panelX + 'px')

  // Escape should close it and release the lock.
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, S)
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }, S)
  await wait(700)
  s = JSON.parse(await evalJs(`JSON.stringify({
    expanded: document.querySelector('button[aria-controls="mobile-menu"]').getAttribute('aria-expanded'),
    bodyOverflow: document.body.style.overflow
  })`))
  check('Escape closes it', s.expanded === 'false', 'aria-expanded=' + s.expanded)
  check('scroll lock released', s.bodyOverflow === '', 'body.overflow=' + (s.bodyOverflow || 'empty'))

  // Tapping a link inside closes it too.
  await evalJs(`document.querySelector('button[aria-controls="mobile-menu"]').click()`)
  await wait(600)
  await evalJs(`document.querySelector('#mobile-menu a[href="/services/"]').click()`)
  await wait(1800)
  s = JSON.parse(await evalJs(`JSON.stringify({
    path: location.pathname,
    expanded: document.querySelector('button[aria-controls="mobile-menu"]').getAttribute('aria-expanded'),
    bodyOverflow: document.body.style.overflow
  })`))
  check('closes on link tap and navigates', s.expanded === 'false' && s.path.includes('services'), 'path=' + s.path)
  check('lock released after navigation', s.bodyOverflow === '', 'body.overflow=' + (s.bodyOverflow || 'empty'))

  // ---- Sticky call bar ---------------------------------------------------
  console.log('\nSticky call bar (390x844)')
  await goto(BASE + '/')
  const barTop = () =>
    evalJs(`(() => { const b=document.querySelector('[data-callbar]');
      return b ? Math.round(b.getBoundingClientRect().top) : -1 })()`)
  const vh = await evalJs('innerHeight')
  const atTop = await barTop()
  check('hidden over the hero', atTop >= vh - 5, 'bar top=' + atTop + ' viewport=' + vh)

  await evalJs(`window.scrollTo(0, 1200)`)
  await wait(1200)
  const scrolled = await barTop()
  check('appears once past the hero', scrolled < vh - 20, 'bar top=' + scrolled)

  await evalJs(`window.scrollTo(0, document.body.scrollHeight)`)
  await wait(1500)
  const atFooter = await barTop()
  const creditVisible = await evalJs(`(() => {
    const a=[...document.querySelectorAll('a')].find(x=>x.textContent.trim()==='Le Design Studio')
    if(!a) return false
    const r=a.getBoundingClientRect()
    const bar=document.querySelector('[data-callbar]')
    const br=bar?bar.getBoundingClientRect():null
    return !br || r.bottom < br.top || br.top >= innerHeight - 5
  })()`)
  check('gets out of the way at the footer', atFooter >= vh - 5, 'bar top=' + atFooter)
  check('never covers the studio credit', creditVisible === true)

  // ---- Anchor deep links -------------------------------------------------
  console.log('\nAnchor deep links')
  await goto(BASE + '/services/#stump-grinding', 390, 844)
  // Lenis eases over ~1.1s; measure only once it has actually settled.
  await wait(3000)
  const anchor = JSON.parse(await evalJs(`(() => {
    const el=document.getElementById('stump-grinding')
    const h=document.querySelector('header')
    const r=el.getBoundingClientRect(), hr=h.getBoundingClientRect()
    return JSON.stringify({ top: Math.round(r.top), headerBottom: Math.round(hr.bottom), scrollY: Math.round(window.scrollY) })
  })()`))
  check('deep link actually scrolls the page', anchor.scrollY > 100, 'scrollY=' + anchor.scrollY)
  check('target clears the fixed header', anchor.top >= anchor.headerBottom - 2 && anchor.top < 400,
    'section top=' + anchor.top + ' header bottom=' + anchor.headerBottom)

  // ---- Reduced motion ----------------------------------------------------
  console.log('\nprefers-reduced-motion: reduce')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, S)
  await goto(BASE + '/', 1280, 900)
  await wait(1500)
  const rm = JSON.parse(await evalJs(`JSON.stringify({
    videos: document.querySelectorAll('video').length,
    lenisClass: document.documentElement.className.includes('lenis'),
    hiddenReveals: [...document.querySelectorAll('[data-reveal]')].filter(e=>getComputedStyle(e).opacity==='0').length,
    posters: document.querySelectorAll('img[src*="poster"]').length
  })`))
  check('mounts no video at all', rm.videos === 0, rm.videos + ' video elements')
  check('Lenis not attached', rm.lenisClass === false)
  check('no content left invisible', rm.hiddenReveals === 0, rm.hiddenReveals + ' hidden')
  check('posters still shown', rm.posters > 0, rm.posters + ' posters')

  console.log('\n' + pass + ' passed, ' + fail + ' failed\n')
  ws.close()
  chrome.kill()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
