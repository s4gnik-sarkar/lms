/**
 * Temporary verification script: opens /login and /signup in headless Chrome
 * via CDP and measures whether the auth card is centered in the viewport.
 * Usage: node check-centering.mjs http://localhost:3100
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333
const BASE = process.argv[2] || 'http://localhost:3100'

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${process.env.TEMP}\\cdp-profile-${Date.now()}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore' }
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function retry(fn, tries = 50, gap = 200) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      await sleep(gap)
    }
  }
  throw lastErr
}

const results = []

try {
  await retry(() =>
    fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => {
      if (!r.ok) throw new Error('devtools not up')
      return r
    })
  )

  const measureExpr = `(() => {
    const form = document.querySelector('form input[type="email"]')
    if (!form) return null
    const card = form.closest('div[class*="max-w-md"]')
    if (!card) return null
    const r = card.getBoundingClientRect()
    const beam = document.querySelector('.border-beam')
    const glow = document.querySelector('.border-beam-glow')
    const shine = document.querySelector('.btn-shine')
    const beamCs = beam ? getComputedStyle(beam) : null
    const shineAfter = shine ? getComputedStyle(shine, '::after') : null
    const doc = document.documentElement
    const cw = document.documentElement.clientWidth
    const ch = document.documentElement.clientHeight
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      cw,
      ch,
      cx: Math.round(r.left + r.width / 2),
      cy: Math.round(r.top + r.height / 2),
      dx: Math.round(r.left + r.width / 2 - window.innerWidth / 2),
      dxc: Math.round(r.left + r.width / 2 - cw / 2),
      dy: Math.round(r.top + r.height / 2 - window.innerHeight / 2),
      cardH: Math.round(r.height),
      scrollH: doc.scrollHeight,
      hasFooter: !!document.querySelector('footer'),
      hasHeader: !!document.querySelector('header'),
      beamPresent: !!beam && !!glow,
      beamAnim: beamCs ? beamCs.animationName : null,
      beamDur: beamCs ? beamCs.animationDuration : null,
      beamPad: beamCs ? beamCs.paddingTop : null,
      beamComposite: beamCs ? (beamCs.maskComposite || beamCs.webkitMaskComposite) : null,
      beamBgIsConic: beamCs ? beamCs.backgroundImage.includes('conic-gradient') : null,
      beamGlowFilter: glow ? getComputedStyle(glow).filter : null,
      shineAnim: shineAfter ? shineAfter.animationName : null,
      submitText: shine ? shine.textContent.trim() : null,
      emailPlaceholder: form.getAttribute('placeholder'),
    }
  })()`

  for (const route of ['/login', '/signup']) {
    const target = await retry(() =>
      fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE + route)}`, {
        method: 'PUT',
      }).then(async (r) => {
        if (!r.ok) throw new Error('cannot create target: ' + r.status)
        return r.json()
      })
    )

    const ws = new WebSocket(target.webSocketDebuggerUrl)
    let msgId = 0
    const pending = new Map()
    const rpc = (method, params = {}) =>
      new Promise((res, rej) => {
        const id = ++msgId
        pending.set(id, { res, rej })
        ws.send(JSON.stringify({ id, method, params }))
      })

    await new Promise((res, rej) => {
      ws.onopen = res
      ws.onerror = () => rej(new Error('ws error'))
    })
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id)
        pending.delete(m.id)
        m.error ? rej(new Error(m.error.message)) : res(m.result)
      }
    }

    await rpc('Page.enable')

    // Wait until the auth form is rendered (checkingAuth resolves)
    let data = null
    const start = Date.now()
    while (Date.now() - start < 20000) {
      const r = await rpc('Runtime.evaluate', { expression: measureExpr, returnByValue: true })
      if (r.result.value) {
        data = r.result.value
        break
      }
      await sleep(300)
    }
    if (!data) throw new Error('form never rendered on ' + route)

    // Desktop viewport screenshot
    const shot = await rpc('Page.captureScreenshot', { format: 'png' })
    writeFileSync(`verify${route.replace(/\//g, '-')}.png`, Buffer.from(shot.data, 'base64'))

    // Also measure at a mobile viewport
    await rpc('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 740,
      deviceScaleFactor: 2,
      mobile: true,
    })
    await sleep(500)
    const mobile = (
      await rpc('Runtime.evaluate', { expression: measureExpr, returnByValue: true })
    ).result.value

    results.push({ route, desktop: data, mobile })
    ws.close()
  }

  console.log(JSON.stringify(results, null, 2))
} finally {
  chrome.kill()
}
