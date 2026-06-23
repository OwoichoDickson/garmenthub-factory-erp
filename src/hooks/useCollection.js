import { useCallback, useEffect, useState } from 'react'
import { table } from '../api/db'

/** Loads a Supabase table with loading state + CRUD helpers and local refresh. */
export function useCollection(name, options = {}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const api = table(name)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.list(options)
      setRows(data)
      setError(null)
    } catch (e) {
      setError(e)
      setRows([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  useEffect(() => {
    reload()
  }, [reload])

  return {
    rows,
    loading,
    error,
    reload,
    create: async (v) => { const r = await api.create(v); await reload(); return r },
    update: async (id, v) => { const r = await api.update(id, v); await reload(); return r },
    remove: async (id) => { await api.remove(id); await reload() },
  }
}
