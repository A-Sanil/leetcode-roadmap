import { useState } from 'react'

export default function CookieSetup({ onSave }) {
  const [cookie, setCookie] = useState('')
  const [step, setStep] = useState(1)

  function handleOpen() {
    window.open('https://leetcode.com', '_blank')
    setStep(2)
  }

  function handleSave() {
    const val = cookie.trim()
    if (!val) return
    localStorage.setItem('lc_session', val)
    onSave(val)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🧩</div>
          <h1 className="text-3xl font-bold text-white mb-2">LeetCode Roadmap</h1>
          <p className="text-gray-400 text-sm">NeetCode 150 — synced to your account</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 divide-y divide-gray-800 overflow-hidden">

          {/* Step 1 */}
          <div className="p-5 flex items-start gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 transition-colors ${step >= 2 ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
              {step >= 2 ? '✓' : '1'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white mb-1">Open LeetCode &amp; sign in</p>
              <p className="text-gray-500 text-sm mb-3">Make sure you're logged into your account in the new tab.</p>
              <button
                onClick={handleOpen}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Open LeetCode ↗
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`p-5 flex items-start gap-4 transition-opacity ${step < 2 ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 transition-colors ${step >= 3 ? 'bg-green-500 text-white' : step === 2 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
              {step >= 3 ? '✓' : '2'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white mb-1">Copy your session cookie</p>
              <p className="text-gray-500 text-sm mb-3">In the LeetCode tab, follow these steps:</p>
              <div className="bg-gray-800 rounded-xl p-4 space-y-2.5 text-sm">
                <Step n="1">Press <Key>F12</Key> to open DevTools</Step>
                <Step n="2">Click the <Tag>Application</Tag> tab at the top</Step>
                <Step n="3">In the left panel, expand <Tag>Cookies</Tag> → <Tag>https://leetcode.com</Tag></Step>
                <Step n="4">Find the row named <Tag color="green">LEETCODE_SESSION</Tag></Step>
                <Step n="5">Click it and copy the full value (it's very long)</Step>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-5 flex items-start gap-4 transition-opacity ${step < 2 ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 ${step === 3 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
              3
            </div>
            <div className="flex-1">
              <p className="font-medium text-white mb-1">Paste it here</p>
              <p className="text-gray-500 text-sm mb-3">Stored only in your browser — never sent to any server except leetcode.com.</p>
              <textarea
                value={cookie}
                onChange={e => { setCookie(e.target.value); setStep(3) }}
                placeholder="Paste LEETCODE_SESSION value here…"
                className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-xl p-3 text-xs text-gray-200 placeholder-gray-600 font-mono resize-none h-20 outline-none transition-colors"
              />
              <button
                onClick={handleSave}
                disabled={!cookie.trim()}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                Connect &amp; Sync →
              </button>
            </div>
          </div>

        </div>

        <p className="text-center text-gray-700 text-xs mt-5">
          Your session cookie is saved in localStorage and only sent to leetcode.com via a local proxy.
        </p>
      </div>
    </div>
  )
}

function Step({ n, children }) {
  return (
    <div className="flex items-start gap-2.5 text-gray-300">
      <span className="text-gray-600 font-mono text-xs mt-0.5 flex-shrink-0">{n}.</span>
      <span>{children}</span>
    </div>
  )
}

function Key({ children }) {
  return (
    <kbd className="bg-gray-700 text-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">{children}</kbd>
  )
}

function Tag({ children, color }) {
  const cls = color === 'green'
    ? 'text-green-400 bg-green-900/40'
    : 'text-blue-300 bg-blue-900/30'
  return (
    <span className={`${cls} px-1.5 py-0.5 rounded text-xs font-mono`}>{children}</span>
  )
}
