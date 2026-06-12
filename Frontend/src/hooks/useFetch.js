// src/hooks/useFetch.js
import { useState, useEffect, useCallback } from 'react'

export function useFetch(fetchFn, deps = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (e) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}

// src/hooks/useAsync.js
export function useAsync() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const run = useCallback(async (asyncFn, onSuccess, onError) => {
    setLoading(true)
    setError(null)
    try {
      const result = await asyncFn()
      if (onSuccess) onSuccess(result)
    } catch (e) {    
      const msg = e.message || 'Operation failed'
      setError(msg)
      if (onError) onError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, run }
}
