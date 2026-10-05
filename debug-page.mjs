/**
 * Debug helper: loads a route, collects console/page errors, dumps DOM text.
 * Usage: node debug-page.mjs http://localhost:3100/login
 */
import { spawn } from 'node:child_process'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9334
const URL_ = process.argv[2]

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${process.env.TEMP}\\cdp-dbg-${Date.now()}`,
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

try {
  await retry(() => fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()))
  const target = await retry(() =>
    fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_)}`, { method: 'PUT' }).then(
      (r) => r.json()
    )
  )
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  const rpc = (method, params = {}) =>
    new Promise((res, rej) => {
      const mid = ++id
      pending.set(mid, { res, rej })
      ws.send(JSON.stringify({ id: mid, method, params }))
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
    } else if (m.method === 'Log.entryAdded') {
      console.log('[console]', m.params.entry.level, m.params.entry.text)
    } else if (m.method === 'Runtime.exceptionThrown') {
      console.log('[exception]', JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 500))
    }
  }
  await rpc('Log.enable')
  await rpc('Runtime.enable')
  await rpc('Page.enable')
  await rpc('Page.navigate', { url: URL_ })
  await sleep(9000)
  const dump = await rpc('Runtime.evaluate', {
    expression: `JSON.stringify({
      text: document.body.innerText.slice(0, 400),
      hasForm: !!document.querySelector('form input[type="email"]'),
      readyState: document.readyState,
      url: location.href
    })`,
    returnByValue: true,
  })
  console.log(dump.result.value)
  ws.close()
} finally {
  chrome.kill()
}
