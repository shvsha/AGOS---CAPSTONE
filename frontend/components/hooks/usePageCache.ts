"use client"

import { useCallback, useEffect, useState } from "react"

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

  const setData = useCallback((update: T | ((prev: T) => T)) => {
    setDataRaw(prev => {
      const next = typeof update === 'function' ? (update as (prev: T) => T)(prev) : update
      caches.set(key, next)
      return next
    })
  }, [key])

  const refetch = useCallback(async () => {
    try {
      const result = await fetcher()
      caches.set(key, result)
      setDataRaw(result)
      return result
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    if (autoFetch) refetch()
  }, [])

  return { data, setData, loading, refetch }
}