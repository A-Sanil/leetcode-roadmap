const APP_URL = 'http://localhost:3001'
const LC_URL  = 'https://leetcode.com'

const dot          = document.getElementById('statusDot')
const statusText   = document.getElementById('statusText')
const mainBtn      = document.getElementById('mainBtn')
const disconnectBtn= document.getElementById('disconnectBtn')
const offlineBanner= document.getElementById('offlineBanner')
const hint         = document.getElementById('hint')

// ── helpers ──────────────────────────────────────────────────────────────────

function setStatus(state, html) {
  dot.className = 'status-dot ' + (state || '')
  statusText.innerHTML = html
}

async function getSessionCookie() {
  return new Promise(resolve => {
    chrome.cookies.get({ url: LC_URL, name: 'LEETCODE_SESSION' }, c => resolve(c?.value || null))
  })
}

async function appPing() {
  try {
    const r = await fetch(APP_URL, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(2000) })
    return r.ok || r.status < 500
  } catch { return false }
}

async function appGetUsername() {
  // POST the stored session to /api/solved and return the username (fast status check)
  try {
    const r = await fetch(APP_URL + '/api/solved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: await getSessionCookie() }),
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return null
    const d = await r.json()
    return d.username || null
  } catch { return null }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function init() {
  setStatus('spin', 'Checking app…')
  mainBtn.disabled = true
  disconnectBtn.style.display = 'none'

  const alive = await appPing()
  if (!alive) {
    offlineBanner.classList.add('visible')
    setStatus('yellow', 'Roadmap app is <strong>offline</strong>')
    mainBtn.disabled = false
    mainBtn.className = 'btn btn-connect'
    mainBtn.textContent = 'Connect Account'
    hint.innerHTML = 'Start <strong>LeetCode Roadmap.exe</strong>, then click Connect.'
    return
  }
  offlineBanner.classList.remove('visible')

  const session = await getSessionCookie()

  if (!session) {
    // Not logged into LeetCode
    setStatus('red', 'Not logged into LeetCode')
    mainBtn.disabled = false
    mainBtn.className = 'btn btn-connect'
    mainBtn.textContent = 'Open LeetCode & Sign In'
    hint.innerHTML = 'Sign in to <a href="https://leetcode.com" target="_blank">leetcode.com</a> first, then come back and click Connect.'
    mainBtn.onclick = () => { chrome.tabs.create({ url: 'https://leetcode.com' }); window.close() }
    return
  }

  // We have a cookie — check if it's already saved in the app
  setStatus('spin', 'Verifying session…')
  const username = await appGetUsername()

  if (username) {
    setStatus('green', `Connected as <strong>@${username}</strong>`)
    mainBtn.className = 'btn btn-connected'
    mainBtn.textContent = '✓ Connected — Open App'
    mainBtn.disabled = false
    mainBtn.onclick = () => { chrome.tabs.create({ url: APP_URL }); window.close() }
    disconnectBtn.style.display = 'block'
    disconnectBtn.onclick = () => sendToApp(null)
    hint.innerHTML = 'Your solved problems sync every 30 min. <a href="' + APP_URL + '" target="_blank">Open Roadmap ↗</a>'
  } else {
    setStatus('yellow', 'LeetCode session found — not yet connected')
    mainBtn.className = 'btn btn-connect'
    mainBtn.textContent = 'Connect Account'
    mainBtn.disabled = false
    mainBtn.onclick = () => sendToApp(session)
    hint.innerHTML = 'Click Connect to send your session to the local Roadmap app.'
  }
}

async function sendToApp(session) {
  mainBtn.disabled = true
  disconnectBtn.style.display = 'none'

  if (!session) {
    // Disconnect: tell the app to clear the session
    try {
      await fetch(APP_URL + '/api/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(3000),
      })
    } catch { /* ignore */ }
    setStatus('', 'Disconnected')
    setTimeout(init, 500)
    return
  }

  setStatus('spin', 'Connecting…')
  try {
    const r = await fetch(APP_URL + '/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
      signal: AbortSignal.timeout(8000),
    })
    const d = await r.json()
    if (d.username) {
      setStatus('green', `Connected as <strong>@${d.username}</strong>`)
      mainBtn.className = 'btn btn-connected'
      mainBtn.textContent = '✓ Connected — Open App'
      mainBtn.disabled = false
      mainBtn.onclick = () => { chrome.tabs.create({ url: APP_URL }); window.close() }
      disconnectBtn.style.display = 'block'
      disconnectBtn.onclick = () => sendToApp(null)
      hint.innerHTML = 'All set! <a href="' + APP_URL + '" target="_blank">Open Roadmap ↗</a>'
    } else {
      setStatus('red', d.error || 'Connection failed')
      mainBtn.disabled = false
      hint.innerHTML = 'Try signing out and back in to LeetCode, then connect again.'
    }
  } catch (e) {
    setStatus('red', 'Could not reach the app')
    mainBtn.disabled = false
    hint.innerHTML = 'Make sure LeetCode Roadmap.exe is still running.'
  }
}

init()
