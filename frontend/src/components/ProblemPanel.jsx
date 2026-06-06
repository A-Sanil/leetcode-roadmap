import { useEffect } from 'react'

const DIFF = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' }

export default function ProblemPanel({ topic, solved, attempted, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const solvedCount = topic.problems.filter(p => solved.has(p.slug)).length
  const total = topic.problems.length
  const pct = Math.round((solvedCount / total) * 100)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800">
          <span className="text-2xl">{topic.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white truncate">{topic.title}</h2>
            <p className="text-xs text-gray-500">{solvedCount}/{total} solved · {pct}%</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-300 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-1 transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : topic.color }}
          />
        </div>

        {/* Problem list */}
        <div className="flex-1 overflow-y-auto">
          {topic.problems.map(p => {
            const isSolved = solved.has(p.slug)
            const isAttempted = !isSolved && attempted.has(p.slug)
            return (
              <a
                key={p.slug}
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors border-b border-gray-800/40 last:border-0"
              >
                <span className="flex-shrink-0 w-5 text-center text-sm">
                  {isSolved
                    ? '✅'
                    : isAttempted
                    ? <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-yellow-500/70" />
                    : <span className="inline-block w-3.5 h-3.5 rounded-full border border-gray-600" />}
                </span>
                <span className={`text-sm flex-1 truncate ${isSolved ? 'line-through text-gray-600' : isAttempted ? 'text-yellow-200/80' : 'text-gray-200'}`}>
                  {p.title}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {p.premium && <span className="text-yellow-600 text-xs">👑</span>}
                  <span className={`text-xs ${DIFF[p.difficulty]}`}>{p.difficulty}</span>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </>
  )
}
