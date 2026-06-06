import { useState, useCallback } from 'react'
import CookieSetup from './components/CookieSetup'
import Header from './components/Header'
import Roadmap from './components/Roadmap'
import ImportModal from './components/ImportModal'
import { useLeetCode } from './hooks/useLeetCode'

function loadCustomRoadmaps() {
  try { return JSON.parse(localStorage.getItem('lc_custom_roadmaps') || '[]') } catch { return [] }
}

export default function App() {
  const [session, setSession] = useState(() => localStorage.getItem('lc_session') || '')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'tree'
  const [activeRoadmap, setActiveRoadmap] = useState('neetcode-150')
  const [customRoadmaps, setCustomRoadmaps] = useState(loadCustomRoadmaps)
  const [showImport, setShowImport] = useState(false)

  const handleLogout = useCallback(() => {
    ['lc_session', 'lc_solved', 'lc_attempted', 'lc_username', 'lc_last_sync']
      .forEach(k => localStorage.removeItem(k))
    setSession('')
  }, [])

  const handleSaveCustom = useCallback((newRoadmap) => {
    setCustomRoadmaps(prev => {
      const updated = [...prev, newRoadmap]
      localStorage.setItem('lc_custom_roadmaps', JSON.stringify(updated))
      return updated
    })
    setActiveRoadmap(newRoadmap.id)
    setShowImport(false)
  }, [])

  const handleDeleteCustom = useCallback((id) => {
    setCustomRoadmaps(prev => {
      const updated = prev.filter(r => r.id !== id)
      localStorage.setItem('lc_custom_roadmaps', JSON.stringify(updated))
      return updated
    })
    setActiveRoadmap('neetcode-150')
  }, [])

  const { solved, attempted, username, loading, error, lastSync, refetch } = useLeetCode(session)

  if (!session) return <CookieSetup onSave={setSession} />

  const activeCustom = customRoadmaps.find(r => r.id === activeRoadmap) || null

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header
        username={username}
        solved={solved}
        loading={loading}
        lastSync={lastSync}
        onRefresh={refetch}
        onLogout={handleLogout}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Roadmap tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-0.5 overflow-x-auto">
          <Tab
            label="NeetCode 150"
            active={activeRoadmap === 'neetcode-150'}
            onClick={() => setActiveRoadmap('neetcode-150')}
          />
          {customRoadmaps.map(r => (
            <Tab
              key={r.id}
              label={r.name}
              active={activeRoadmap === r.id}
              onClick={() => setActiveRoadmap(r.id)}
              onDelete={() => handleDeleteCustom(r.id)}
            />
          ))}
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-2.5 text-sm text-gray-600 hover:text-gray-400 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <span className="text-base leading-none">+</span> New
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-red-950/60 border border-red-800 rounded-xl p-3 text-sm text-red-300 flex items-start gap-2">
            <span>⚠️</span>
            <div>
              <strong>Sync failed:</strong> {error} — your session may have expired.{' '}
              <button onClick={handleLogout} className="underline text-red-400">Reconnect</button>
            </div>
          </div>
        </div>
      )}

      <Roadmap
        solved={solved}
        attempted={attempted}
        loading={loading}
        viewMode={viewMode}
        customData={activeCustom}
      />

      {showImport && (
        <ImportModal
          session={session}
          onSave={handleSaveCustom}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}

function Tab({ label, active, onClick, onDelete }) {
  return (
    <div className={`flex items-center gap-1 border-b-2 transition-colors ${active ? 'border-blue-500' : 'border-transparent'}`}>
      <button
        onClick={onClick}
        className={`px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${active ? 'text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}
      >
        {label}
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-gray-700 hover:text-gray-400 text-xs pr-2 transition-colors"
          title="Delete roadmap"
        >
          ×
        </button>
      )}
    </div>
  )
}
