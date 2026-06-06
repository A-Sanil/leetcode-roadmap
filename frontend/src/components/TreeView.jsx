import { useState, useRef, useEffect } from 'react'
import { roadmap } from '../data/roadmap'
import { nodeLayout, edges, NODE_W, NODE_H, VB_W, VB_H } from '../data/graphLayout'
import ProblemPanel from './ProblemPanel'

export default function TreeView({ solved, attempted, customData }) {
  const [selectedId, setSelectedId] = useState(null)
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / VB_W)
    })
    if (wrapperRef.current) obs.observe(wrapperRef.current)
    return () => obs.disconnect()
  }, [])

  const topics = customData ? buildCustomLayout(customData.sections) : roadmap
  const selectedTopic = selectedId ? topics.find(t => t.id === selectedId) : null

  return (
    <main className="px-4 py-8 max-w-5xl mx-auto">
      {/* Scaled tree container */}
      <div ref={wrapperRef} style={{ overflow: 'hidden', height: `${VB_H * scale}px` }}>
        <div style={{
          width: VB_W,
          height: VB_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
        }}>
          {/* SVG arrows layer */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: VB_W, height: VB_H, pointerEvents: 'none' }}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto">
                <polygon points="0 0, 8 3.5, 0 7" fill="#4b5563" />
              </marker>
            </defs>
            {edges.map(([fromId, toId]) => {
              const from = nodeLayout[fromId]
              const to = nodeLayout[toId]
              if (!from || !to) return null
              const x1 = from.x + NODE_W / 2
              const y1 = from.y + NODE_H
              const x2 = to.x + NODE_W / 2
              const y2 = to.y - 2
              return (
                <path
                  key={`${fromId}-${toId}`}
                  d={`M ${x1} ${y1} C ${x1} ${y1 + 35} ${x2} ${y2 - 35} ${x2} ${y2}`}
                  stroke="#374151"
                  strokeWidth="1.5"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  opacity="0.75"
                />
              )
            })}
          </svg>

          {/* Topic nodes */}
          {topics.map(topic => {
            const pos = nodeLayout[topic.id]
            if (!pos) return null
            const solvedCount = topic.problems.filter(p => solved.has(p.slug)).length
            const total = topic.problems.length
            const pct = total > 0 ? (solvedCount / total) * 100 : 0
            const complete = solvedCount === total && total > 0
            const isSelected = selectedId === topic.id

            return (
              <button
                key={topic.id}
                onClick={() => setSelectedId(isSelected ? null : topic.id)}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: NODE_W,
                }}
                className={`rounded-lg border text-left transition-all duration-150 overflow-hidden
                  ${isSelected
                    ? 'border-blue-500 shadow-lg shadow-blue-500/30 bg-blue-950/50 scale-105'
                    : complete
                    ? 'border-green-700/60 bg-gray-900 hover:border-green-500 hover:shadow-md hover:shadow-green-900/30'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500 hover:shadow-md hover:shadow-gray-900/40'}`}
              >
                <div className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-white leading-tight truncate">{topic.title}</span>
                    <span className={`text-xs flex-shrink-0 font-mono ml-1 ${complete ? 'text-green-400' : 'text-gray-500'}`}>
                      {solvedCount}/{total}
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-gray-800">
                  <div
                    className="h-1 transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: complete ? '#22c55e' : topic.color }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Problem panel */}
      {selectedTopic && (
        <ProblemPanel
          topic={selectedTopic}
          solved={solved}
          attempted={attempted}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  )
}

// For custom roadmaps, fake a layout by mapping to available nodeLayout keys
// (custom sections use the same IDs as NeetCode categories when possible)
function buildCustomLayout(sections) {
  return sections.map(s => ({
    ...s,
    icon: s.icon || '📁',
    color: s.color || '#6b7280',
  }))
}
