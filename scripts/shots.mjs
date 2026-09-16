/**
 * Dev-only screenshot harness. Drives headless Chrome over the DevTools
 * protocol so responsive checks are reproducible and do not depend on a visible
 * browser window.
 *
 *   node scripts/shots.mjs <outDir> <width>x<height>[,...] [path]
 *
 * Not part of the site build.
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

const outDir = process.argv[2] ?? 'shots'
const sizes = (process.argv[3] ?? '1440x900').split(',').map((s) => {
  const [w, h] = s.split('x').map(Number)
  return { w, h }
})
const urlPath = process.argv[4] ?? '/'
const fullPage = process.env.FULL_PAGE === '1'

const PORT = 9333

function launch() {
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--user-data-dir=' + path.join(process.env.TEMP ?? '.', 'nl-chrome-shots'),
      'about:blank',
    ],
    { stdio: 'ignore' }
  )
  return child
}

async function waitForWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (r.ok) return (await r.json()).webSocketDebuggerUrl
    } catch {}
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error('Chrome DevTools endpoint never came up')
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const chrome = launch()
  const wsUrl = await waitForWs()

  // Node's built-in WebSocket, so the event shape matches the browser API used below.
  const ws = new globalThis.WebSocket(wsUrl)
  let id = 0
  const pending = new Map()
  const sessions = new Map()

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
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
  sessions.set(targetId, sessionId)

  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)

  for (const { w, h } of sizes) {
    await send(
      'Emulation.setDeviceMetricsOverride',
      { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 },
      sessionId
    )
    await send('Page.navigate', { url: BASE + urlPath }, sessionId)
    await new Promise((r) => setTimeout(r, 2600))

    // Scroll the whole page once so every whileInView reveal and every lazy
    // image actually fires, then return to the top. Without this a full-page
    // capture shows all the revealed sections still at opacity 0.
    await send(
      'Runtime.evaluate',
      {
        awaitPromise: true,
        expression: `(async () => {
          const step = window.innerHeight * 0.8
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y)
            await new Promise(r => setTimeout(r, 170))
          }
          window.scrollTo(0, 0)
          await new Promise(r => setTimeout(r, 700))
        })()`,
      },
      sessionId
    )

    // Full-page capture must NOT resize the viewport. Growing the viewport to
    // the content height makes every svh/dvh unit resolve against that height,
    // so a 100svh hero balloons and the capture shows a layout that does not
    // exist. captureBeyondViewport + an explicit clip keeps the viewport honest.
    let clip
    if (fullPage) {
      const { cssContentSize } = await send('Page.getLayoutMetrics', {}, sessionId)
      clip = {
        x: 0,
        y: 0,
        width: w,
        height: Math.min(Math.ceil(cssContentSize.height), 16000),
        scale: 1,
      }
    }

    const { data } = await send(
      'Page.captureScreenshot',
      { format: 'jpeg', quality: 78, captureBeyondViewport: fullPage, ...(clip ? { clip } : {}) },
      sessionId
    )
    const file = path.join(outDir, `${urlPath.replace(/\W+/g, '_')}_${w}.jpg`)
    await writeFile(file, Buffer.from(data, 'base64'))
    console.log('wrote ' + file)
  }

  ws.close()
  chrome.kill()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
