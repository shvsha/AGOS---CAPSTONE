"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const caches = new Map<string, any>()

export function usePageCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  initial: T,
  options?: { autoFetch?: boolean }
) {
  const autoFetch = options?.autoFetch ?? true
  const cached = caches.get(key) as T | undefined
  const [data, setDataRaw] = useState<T>(cached ?? initial)
  const [loading, setLoading] = useState(cached === undefined)
  const [error, setError] = useState(false)

  // Always keep the latest fetcher available, even though `refetch`
  // itself stays referentially stable (keyed only by `key`).
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const setData = useCallback((update: T | ((prev: T) => T)) => {
    setDataRaw(prev => {
      const next = typeof update === 'function' ? (update as (prev: T) => T)(prev) : update
      caches.set(key, next)
      return next
    })
  }, [key])

  const refetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      caches.set(key, result)
      setDataRaw(result)
      setError(false)
      return result
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    if (autoFetch) refetch()
  }, [])

  return { data, setData, loading, error, refetch }
}