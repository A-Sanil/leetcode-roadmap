import { useState } from 'react'

const DIFF = {
  Easy: 'text-green-400',
  Medium: 'text-yellow-400',
  Hard: 'text-red-400',
}

export default function TopicSection({ topic, solved, attempted }) {
  const [open, setOpen] = useState(false)

  const solvedCount = topic.problems.filter(p => solved.has(p.slug)).length
  const total = topic.problems.length
  const pct = total > 0 ? (solvedCount / total) * 100 : 0
  const complete = solvedCount === total

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors overflow-hidden">

      {/* Card header — click to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center gap-3 text-left group"
      >
        <span className="text-2xl flex-shrink-0">{topic.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-white text-sm truncate pr-2">{topic.title}</span>
            <span className={`text-xs flex-shrink-0 font-mono ${complete ? 'text-green-400' : 'text-gray-500'}`}>
              {solvedCount}/{total}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: complete ? '#22c55e' : topic.color }}
            />
          </div>
        </div>

        <span
          className="text-gray-600 group-hover:text-gray-400 text-xs flex-shrink-0 transition-all"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
        >
          ▼
        </span>
      </button>

      {/* Problem list */}
      {open && (
        <div className="border-t border-gray-800">
          {topic.problems.map(p => {
            const isSolved = solved.has(p.slug)
            const isAttempted = !isSolved && attempted.has(p.slug)
            return (
              <a
                key={p.slug}
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/60 transition-colors border-b border-gray-800/40 last:border-0"
              >
                <span className="flex-shrink-0 w-5 text-center text-base">
                  {isSolved
                    ? '✅'
                    : isAttempted
                    ? <span className="inline-block w-4 h-4 rounded-full border-2 border-yellow-500/70" />
                    : <span className="inline-block w-4 h-4 rounded-full border border-gray-600" />}
                </span>
                <span className={`text-sm flex-1 truncate ${isSolved ? 'line-through text-gray-600' : isAttempted ? 'text-yellow-200/80' : 'text-gray-200'}`}>
                  {p.title}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {p.premium && <span title="Premium" className="text-yellow-600 text-xs">👑</span>}
                  <span className={`text-xs ${DIFF[p.difficulty]}`}>{p.difficulty}</span>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
