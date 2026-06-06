import { useState, useEffect } from 'react'

export default function CookieSetup({ onSave }) {
  const [cookie, setCookie] = useState('')
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState('extension') // 'extension' | 'manual'
  const [extStatus, setExtStatus] = useState('waiting') // 'waiting' | 'connected' | 'error'
  const [extUser, setExtUser] = useState('')

  // Poll for the extension having pushed a session
  useEffect(() => {
    if (mode !== 'extension') return
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/pending-session')
        const d = await r.json()
        if (d?.session) {
          clearInterval(id)
          localStorage.setItem('lc_session', d.session)
          setExtUser(d.username)
          setExtStatus('connected')
          setTimeout(() => onSave(d.session), 800)
        }
      } catch { /* server not ready yet */ }
    }, 1500)
    return () => clearInterval(id)
  }, [mode, onSave])

  function handleManualSave() {
    const val = cookie.trim()
    if (!val) return
    localStorage.setItem('lc_session', val)
    onSave(val)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🧩</div>
          <h1 className="text-3xl font-bold text-white mb-2">LeetCode Roadmap</h1>
          <p className="text-gray-400 text-sm">NeetCode 150 — synced to your account</p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-800 p-1 rounded-xl mb-5">
          <ModeBtn active={mode === 'extension'} onClick={() => setMode('extension')}>
            🔌 Extension (Easy)
          </ModeBtn>
          <ModeBtn active={mode === 'manual'} onClick={() => setMode('manual')}>
            🔧 Manual (Advanced)
          </ModeBtn>
        </div>

        {/* ── EXTENSION FLOW ── */}
        {mode === 'extension' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">

            {extStatus === 'connected' ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-white font-semibold text-lg">Connected as @{extUser}</p>
                <p className="text-gray-500 text-sm mt-1">Loading your roadmap…</p>
              </div>
            ) : (
              <>
                <div className="p-5 flex items-start gap-4 border-b border-gray-800">
                  <StepBadge n={1} done={false} />
                  <div className="flex-1">
                    <p className="font-medium text-white mb-1">Install the extension</p>
                    <p className="text-gray-500 text-sm mb-3">
                      Load the <strong className="text-gray-300">LeetCode Roadmap Connector</strong> extension in Chrome or Edge.
                    </p>
                    <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm text-gray-400">
                      <p>1. Open <Key>chrome://extensions</Key> (or <Key>edge://extensions</Key>)</p>
                      <p>2. Enable <Tag>Developer mode</Tag> (top-right toggle)</p>
                      <p>3. Click <Tag color="blue">Load unpacked</Tag></p>
                      <p>4. Select the <Tag color="green">extension/</Tag> folder next to this app</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex items-start gap-4 border-b border-gray-800">
                  <StepBadge n={2} done={false} />
                  <div className="flex-1">
                    <p className="font-medium text-white mb-1">Sign in to LeetCode</p>
                    <p className="text-gray-500 text-sm">
                      Make sure you're logged into{' '}
                      <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300">
                        leetcode.com
                      </a>{' '}
                      in your browser.
                    </p>
                  </div>
                </div>

                <div className="p-5 flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 ${extStatus === 'waiting' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white mb-1">Click Connect in the extension</p>
                    <p className="text-gray-500 text-sm mb-3">
                      Click the 🧩 extension icon in your toolbar and hit <strong className="text-white">Connect Account</strong>.
                    </p>
                    <div className={`flex items-center gap-2 text-sm ${extStatus === 'waiting' ? 'text-blue-400 animate-pulse' : 'text-green-400'}`}>
                      <span>{extStatus === 'waiting' ? '⏳' : '✅'}</span>
                      <span>{extStatus === 'waiting' ? 'Waiting for extension…' : `Connected as @${extUser}`}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MANUAL FLOW ── */}
        {mode === 'manual' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800 overflow-hidden">

            <div className="p-5 flex items-start gap-4">
              <StepBadge n={1} done={step >= 2} />
              <div className="flex-1">
                <p className="font-medium text-white mb-1">Open LeetCode &amp; sign in</p>
                <p className="text-gray-500 text-sm mb-3">Make sure you're logged into your account in the new tab.</p>
                <button
                  onClick={() => { window.open('https://leetcode.com', '_blank'); setStep(2) }}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Open LeetCode ↗
                </button>
              </div>
            </div>

            <div className={`p-5 flex items-start gap-4 transition-opacity ${step < 2 ? 'opacity-40 pointer-events-none' : ''}`}>
              <StepBadge n={2} done={step >= 3} />
              <div className="flex-1">
                <p className="font-medium text-white mb-1">Copy your session cookie</p>
                <p className="text-gray-500 text-sm mb-3">In the LeetCode tab:</p>
                <div className="bg-gray-800 rounded-xl p-4 space-y-2.5 text-sm">
                  <ManualStep n="1">Press <Key>F12</Key> to open DevTools</ManualStep>
                  <ManualStep n="2">Click the <Tag>Application</Tag> tab at the top</ManualStep>
                  <ManualStep n="3">Expand <Tag>Cookies</Tag> → <Tag>https://leetcode.com</Tag></ManualStep>
                  <ManualStep n="4">Find the row named <Tag color="green">LEETCODE_SESSION</Tag></ManualStep>
                  <ManualStep n="5">Double-click its value cell and copy the full text</ManualStep>
                </div>
              </div>
            </div>

            <div className={`p-5 flex items-start gap-4 transition-opacity ${step < 2 ? 'opacity-40 pointer-events-none' : ''}`}>
              <StepBadge n={3} done={false} />
              <div className="flex-1">
                <p className="font-medium text-white mb-1">Paste it here</p>
                <p className="text-gray-500 text-sm mb-3">Stored only in your browser — never sent anywhere except leetcode.com.</p>
                <textarea
                  value={cookie}
                  onChange={e => { setCookie(e.target.value); setStep(3) }}
                  placeholder="Paste LEETCODE_SESSION value here…"
                  className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-xl p-3 text-xs text-gray-200 placeholder-gray-600 font-mono resize-none h-20 outline-none transition-colors"
                />
                <button
                  onClick={handleManualSave}
                  disabled={!cookie.trim()}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  Connect &amp; Sync →
                </button>
              </div>
            </div>

          </div>
        )}

        <p className="text-center text-gray-700 text-xs mt-5">
          Your session cookie is stored in localStorage and only sent to leetcode.com via a local proxy.
        </p>
      </div>
    </div>
  )
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-gray-950 text-white' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}

function StepBadge({ n, done }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 transition-colors ${done ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
      {done ? '✓' : n}
    </div>
  )
}

function ManualStep({ n, children }) {
  return (
    <div className="flex items-start gap-2.5 text-gray-300">
      <span className="text-gray-600 font-mono text-xs mt-0.5 flex-shrink-0">{n}.</span>
      <span>{children}</span>
    </div>
  )
}

function Key({ children }) {
  return <kbd className="bg-gray-700 text-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">{children}</kbd>
}

function Tag({ children, color }) {
  const cls = color === 'green'
    ? 'text-green-400 bg-green-900/40'
    : color === 'blue'
    ? 'text-blue-300 bg-blue-900/30'
    : 'text-blue-300 bg-blue-900/30'
  return <span className={`${cls} px-1.5 py-0.5 rounded text-xs font-mono`}>{children}</span>
}
