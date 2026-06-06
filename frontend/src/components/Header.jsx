function timeAgo(ts) {
  if (!ts) return null
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default function Header({ username, solved, loading, lastSync, onRefresh, onLogout, viewMode, onViewModeChange }) {
  const synced = timeAgo(lastSync)

  return (
    <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg">🧩</span>
          <span className="font-bold text-white text-base">LeetCode Roadmap</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg p-0.5 gap-0.5">
            <ViewBtn active={viewMode === 'grid'} onClick={() => onViewModeChange('grid')} title="Grid view">
              ⊞
            </ViewBtn>
            <ViewBtn active={viewMode === 'tree'} onClick={() => onViewModeChange('tree')} title="Roadmap tree view">
              ◉
            </ViewBtn>
          </div>

          {solved.size > 0 && (
            <span className="text-gray-500 text-xs hidden sm:block">
              <span className="text-green-400 font-semibold">{solved.size}</span>/150
            </span>
          )}

          {synced && (
            <span className="text-gray-700 text-xs hidden md:block">synced {synced}</span>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <span className={loading ? 'animate-spin' : ''}>↻</span>
            <span className="hidden sm:inline">{loading ? 'Syncing…' : 'Sync'}</span>
          </button>

          {username && (
            <div className="flex items-center gap-1.5">
              <a
                href={`https://leetcode.com/${username}/`}
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:text-orange-300 text-xs font-medium"
              >
                @{username}
              </a>
              <button onClick={onLogout} className="text-gray-700 hover:text-gray-400 text-xs" title="Disconnect">×</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function ViewBtn({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded-md text-sm transition-colors ${active ? 'bg-gray-950 text-white' : 'text-gray-500 hover:text-gray-300'}`}
    >
      {children}
    </button>
  )
}
