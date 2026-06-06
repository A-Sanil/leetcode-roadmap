import { roadmap, PHASES } from '../data/roadmap'
import TopicSection from './TopicSection'
import TreeView from './TreeView'

export default function Roadmap({ solved, attempted, loading, viewMode, customData }) {
  const topics = customData ? customData.sections : roadmap
  const totalSolved = topics.reduce(
    (acc, t) => acc + t.problems.filter(p => solved.has(p.slug)).length, 0
  )
  const total = topics.reduce((acc, t) => acc + t.problems.length, 0)
  const pct = total > 0 ? Math.round((totalSolved / total) * 100) : 0
  const label = customData ? customData.name : 'NeetCode 150'

  if (viewMode === 'tree') {
    return (
      <>
        <ProgressBanner label={label} totalSolved={totalSolved} total={total} pct={pct} loading={loading} />
        <TreeView solved={solved} attempted={attempted} customData={customData} />
      </>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <ProgressBanner label={label} totalSolved={totalSolved} total={total} pct={pct} loading={loading} inline />

      {customData ? (
        // Custom roadmap: flat sections grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {topics.map(topic => (
            <TopicSection key={topic.id} topic={topic} solved={solved} attempted={attempted} />
          ))}
        </div>
      ) : (
        // NeetCode 150: grouped by phase
        PHASES.map(phase => {
          const phaseTopics = roadmap.filter(t => t.phase === phase.id)
          if (!phaseTopics.length) return null
          const phaseSolved = phaseTopics.reduce(
            (acc, t) => acc + t.problems.filter(p => solved.has(p.slug)).length, 0
          )
          const phaseTotal = phaseTopics.reduce((acc, t) => acc + t.problems.length, 0)
          return (
            <section key={phase.id} className="mb-10 mt-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-gray-300 font-semibold text-xs uppercase tracking-widest">{phase.label}</h3>
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-600 text-xs font-mono">{phaseSolved}/{phaseTotal}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {phaseTopics.map(topic => (
                  <TopicSection key={topic.id} topic={topic} solved={solved} attempted={attempted} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </main>
  )
}

function ProgressBanner({ label, totalSolved, total, pct, loading, inline }) {
  return (
    <div className={`${inline ? 'mb-0' : ''} bg-gray-900 border-b border-gray-800 px-4 py-4`}>
      <div className="max-w-5xl mx-auto flex items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">{label}</span>
            <span className="text-sm text-gray-500 font-mono">
              <span className="text-white font-semibold">{totalSolved}</span>/{total}
              <span className="text-gray-600 ml-2">{pct}%</span>
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {loading && <p className="text-gray-700 text-xs mt-1.5 animate-pulse">Syncing…</p>}
        </div>
      </div>
    </div>
  )
}
