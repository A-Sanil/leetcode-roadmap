import { useState } from 'react'
import { roadmap } from '../data/roadmap'

// tag slug → our category ID, in priority order (most specific first)
const TAG_PRIORITY = [
  ['trie', 'tries'],
  ['heap-priority-queue', 'heap'],
  ['backtracking', 'backtracking'],
  ['bit-manipulation', 'bit-manipulation'],
  ['topological-sort', 'advanced-graphs'],
  ['minimum-spanning-tree', 'advanced-graphs'],
  ['shortest-path', 'advanced-graphs'],
  ['union-find', 'graphs'],
  ['graph', 'graphs'],
  ['depth-first-search', 'graphs'],
  ['breadth-first-search', 'graphs'],
  ['binary-search-tree', 'trees'],
  ['binary-tree', 'trees'],
  ['tree', 'trees'],
  ['linked-list', 'linked-list'],
  ['doubly-linked-list', 'linked-list'],
  ['dynamic-programming', 'dp-1d'],
  ['memoization', 'dp-1d'],
  ['matrix', 'dp-2d'],
  ['greedy', 'greedy'],
  ['monotonic-stack', 'stack'],
  ['stack', 'stack'],
  ['binary-search', 'binary-search'],
  ['divide-and-conquer', 'binary-search'],
  ['two-pointers', 'two-pointers'],
  ['sliding-window', 'sliding-window'],
  ['geometry', 'math-geometry'],
  ['math', 'math-geometry'],
  ['hash-table', 'arrays-hashing'],
  ['array', 'arrays-hashing'],
  ['string', 'arrays-hashing'],
  ['sorting', 'arrays-hashing'],
  ['prefix-sum', 'arrays-hashing'],
]

function tagToCategory(tags) {
  const slugSet = new Set(tags.map(t => t.slug || t.toLowerCase().replace(/ /g, '-')))
  for (const [tag, cat] of TAG_PRIORITY) {
    if (slugSet.has(tag)) return cat
  }
  return 'arrays-hashing' // default
}

function parseSlugs(text) {
  const slugs = new Set()
  // Extract from URLs like https://leetcode.com/problems/two-sum/
  for (const m of text.matchAll(/problems\/([a-z0-9-]+)/g)) slugs.add(m[1])
  // Also treat bare slugs (lines with no slash, no space)
  for (const line of text.split(/\n/)) {
    const t = line.trim().toLowerCase()
    if (t && !t.includes('/') && !t.includes(' ') && t.match(/^[a-z0-9-]+$/)) {
      slugs.add(t)
    }
  }
  return [...slugs]
}

// Returns { id, type } where type is 'list' (selectedList) or 'favorite' (favoriteSlug / company)
function parseImportSource(text) {
  const t = text.trim()
  // Format: https://leetcode.com/list?selectedList=abc123
  let m = t.match(/selectedList=([a-zA-Z0-9]+)/)
  if (m) return { id: m[1], type: 'list' }

  // Format: https://leetcode.com/company/amazon/?favoriteSlug=amazon-all
  // Format: https://leetcode.com/studyPlan/top-interview-150/?favoriteSlug=top-interview-150
  // Format: https://leetcode.com/problems/?favoriteSlug=...
  m = t.match(/[?&]favoriteSlug=([a-zA-Z0-9_-]+)/)
  if (m) return { id: m[1], type: 'favorite' }

  // Format: just a bare slug like "amazon-all" or "top-interview-150"
  if (t && /^[a-zA-Z0-9_-]+$/.test(t)) return { id: t, type: 'favorite' }

  return null
}

// Category metadata lookup from our roadmap data
const catMeta = Object.fromEntries(roadmap.map(t => [t.id, { title: t.title, icon: t.icon, color: t.color }]))

export default function ImportModal({ session, onSave, onClose }) {
  const [name, setName] = useState('')
  const [tab, setTab] = useState('paste') // 'paste' | 'collection'
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [preview, setPreview] = useState(null) // grouped sections
  const [error, setError] = useState('')

  async function fetchTagsForSlugs(slugs) {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs, session }),
    })
    if (!res.ok) throw new Error(`Tags API error ${res.status}`)
    return res.json()
  }

  async function fetchList(id, type) {
    const res = await fetch('/api/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type, session }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `List API error ${res.status}`)
    }
    return res.json()
  }

  async function handleBuild() {
    if (!name.trim()) { setError('Please enter a roadmap name.'); return }
    if (!input.trim()) { setError('Please enter some problems or a collection URL.'); return }
    setError('')
    setLoading(true)
    setPreview(null)

    try {
      let problems = []

      if (tab === 'collection') {
        const source = parseImportSource(input.trim())
        if (!source) throw new Error('Could not parse a list from that URL. Supported formats:\n• https://leetcode.com/company/amazon/?favoriteSlug=amazon-all\n• https://leetcode.com/list?selectedList=XXXXX\n• A bare slug like: amazon-all')
        setProgress(`Fetching collection "${source.id}"…`)
        const listData = await fetchList(source.id, source.type)
        problems = listData.problems || []
        if (problems.length === 0) throw new Error('No problems returned. The list may be private or require premium.')
      } else {
        const slugs = parseSlugs(input)
        if (slugs.length === 0) throw new Error('No valid problem slugs found. Paste LeetCode problem URLs or slugs (e.g. two-sum).')
        setProgress(`Fetching tags for ${slugs.length} problems…`)
        const tagged = await fetchTagsForSlugs(slugs)
        problems = tagged.filter(p => p.title) // filter errors
      }

      if (problems.length === 0) throw new Error('No problems found.')

      // Group by category
      const groups = {}
      for (const p of problems) {
        const catId = tagToCategory(p.topicTags || [])
        if (!groups[catId]) groups[catId] = []
        groups[catId].push({ slug: p.titleSlug || p.slug, title: p.title, difficulty: p.difficulty || 'Medium' })
      }

      // Build ordered sections (follow NeetCode order where possible, then extras)
      const orderedIds = roadmap.map(t => t.id)
      const sections = []
      for (const id of orderedIds) {
        if (groups[id]) {
          const meta = catMeta[id] || {}
          sections.push({
            id,
            title: meta.title || id,
            icon: meta.icon || '📁',
            color: meta.color || '#6b7280',
            problems: groups[id],
          })
        }
      }
      // Any uncategorized extras
      for (const [id, probs] of Object.entries(groups)) {
        if (!orderedIds.includes(id)) {
          sections.push({ id, title: id, icon: '📁', color: '#6b7280', problems: probs })
        }
      }

      setPreview(sections)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  function handleSave() {
    if (!preview) return
    const newRoadmap = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      createdAt: Date.now(),
      sections: preview,
    }
    onSave(newRoadmap)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-bold text-white text-lg">New Roadmap</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-2xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Name */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Roadmap name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Amazon Prep, FAANG 100, Graph Review…"
              className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors"
            />
          </div>

          {/* Source tabs */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Import from</label>
            <div className="flex gap-1 bg-gray-800 p-1 rounded-xl">
              <TabBtn active={tab === 'paste'} onClick={() => setTab('paste')}>Paste Problem Links</TabBtn>
              <TabBtn active={tab === 'collection'} onClick={() => setTab('collection')}>Collection URL</TabBtn>
            </div>
          </div>

          {/* Input */}
          {tab === 'paste' ? (
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">
                Problem URLs or slugs (one per line)
              </label>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`https://leetcode.com/problems/two-sum/\nhttps://leetcode.com/problems/house-robber/\nmaximum-subarray\nword-break`}
                className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-xl p-3 text-xs text-gray-200 placeholder-gray-600 font-mono resize-none h-32 outline-none transition-colors"
              />
              <p className="text-gray-700 text-xs mt-1.5">
                Paste full LeetCode URLs or just slugs like <code className="text-gray-500">two-sum</code>. Tags are fetched automatically.
              </p>
            </div>
          ) : (
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">LeetCode list URL</label>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="https://leetcode.com/company/amazon/?favoriteSlug=amazon-all"
                className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 font-mono outline-none transition-colors"
              />
              <p className="text-gray-700 text-xs mt-1.5">
                Public lists work without login. Private lists need your session cookie saved.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl p-3 text-red-300 text-sm">{error}</div>
          )}

          {loading && (
            <div className="text-center py-4 text-gray-400 text-sm animate-pulse">{progress || 'Building…'}</div>
          )}

          {/* Preview */}
          {preview && (
            <div>
              <p className="text-sm text-gray-400 mb-2">
                Preview — {preview.reduce((a, s) => a + s.problems.length, 0)} problems across {preview.length} categories
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {preview.map(section => (
                  <div key={section.id} className="bg-gray-800 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{section.icon}</span>
                      <span className="text-sm font-medium text-white">{section.title}</span>
                      <span className="text-xs text-gray-500 ml-auto">{section.problems.length} problems</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {section.problems.slice(0, 8).map(p => (
                        <span key={p.slug} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full truncate max-w-[120px]">{p.title}</span>
                      ))}
                      {section.problems.length > 8 && (
                        <span className="text-xs text-gray-600">+{section.problems.length - 8} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 flex gap-3">
          {!preview ? (
            <button
              onClick={handleBuild}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              {loading ? 'Building…' : 'Build Roadmap'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setPreview(null)}
                className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm transition-colors"
              >
                Save Roadmap
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-400 py-2.5 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
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
