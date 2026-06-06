import { useState, useEffect, useCallback, useRef } from 'react'

const SYNC_INTERVAL = 30 * 60 * 1000

function loadCache() {
  try {
    return {
      solved: new Set(JSON.parse(localStorage.getItem('lc_solved') || '[]')),
      attempted: new Set(JSON.parse(localStorage.getItem('lc_attempted') || '[]')),
      username: localStorage.getItem('lc_username') || '',
      lastSync: Number(localStorage.getItem('lc_last_sync')) || null,
    }
  } catch {
    return { solved: new Set(), attempted: new Set(), username: '', lastSync: null }
  }
}

export function useLeetCode(session) {
  const [state, setState] = useState(() => ({
    ...loadCache(),
    loading: false,
    error: null,
  }))
  const sessionRef = useRef(session)
  sessionRef.current = session

  const sync = useCallback(async () => {
    const s = sessionRef.current
    if (!s) return
    setState(p => ({ ...p, loading: true, error: null }))
    try {
      // Use the REST API — much more reliable than GraphQL for solved status.
      // GraphQL's questionList.status silently returns null when CSRF isn't fully
      // validated, causing problems to appear unsolved even when they aren't.
      const res = await fetch('/api/solved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: s }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const solved = new Set(data.solved || [])
      const attempted = new Set(data.attempted || [])
      const username = data.username || ''

      const now = Date.now()
      localStorage.setItem('lc_solved', JSON.stringify([...solved]))
      localStorage.setItem('lc_attempted', JSON.stringify([...attempted]))
      localStorage.setItem('lc_username', username)
      localStorage.setItem('lc_last_sync', String(now))

      setState({ solved, attempted, username, loading: false, error: null, lastSync: now })
    } catch (err) {
      setState(p => ({ ...p, loading: false, error: err.message }))
    }
  }, [])

  useEffect(() => {
    if (!session) return
    const { lastSync } = loadCache()
    if (!lastSync || Date.now() - lastSync > SYNC_INTERVAL) sync()
  }, [session, sync])

  return { ...state, refetch: sync }
}
