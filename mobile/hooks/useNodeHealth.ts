import { useState, useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { api } from '../lib/api'
import { currentMonthValue } from '../lib/months'
import type { NodeHealthLog } from '../types/health'

export type HealthTab = 'All' | 'Normal' | 'Warning' | 'Critical'
export const HEALTH_PAGE_SIZE = 10

const pad = (n: number) => String(n).padStart(2, '0')

// 'YYYY-MM' -> first and last day of that month ('All' = no limit)
function monthRange(month: string): { from?: string; to?: string } {
  if (month === 'All') return {}
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay)}` }
}

export function useNodeHealth(nodeId: number) {
  const [latest, setLatest] = useState<NodeHealthLog | null>(null)
  const [logs, setLogs] = useState<NodeHealthLog[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [summary, setSummary] = useState({ total: 0, normal: 0, warning: 0, critical: 0 })
  const [tab, setTab] = useState<HealthTab>('All')
  const [month, setMonth] = useState<string>(currentMonthValue())
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(false)

  const tabRef = useRef<HealthTab>('All')
  const monthRef = useRef<string>(currentMonthValue())
  const pageRef = useRef(1)
  const requestId = useRef(0) // drops responses from superseded requests
  const loadedOnce = useRef(false)

  const fetchAll = useCallback(async (isRefresh = false) => {
    const mine = ++requestId.current
    if (isRefresh) setRefreshing(true)
    else if (!loadedOnce.current) setLoading(true)
    setFetching(true)
    setError(false)

    try {
      const params = new URLSearchParams({
        page: String(pageRef.current),
        page_size: String(HEALTH_PAGE_SIZE),
      })
      if (tabRef.current !== 'All') params.set('status', tabRef.current)
      const { from, to } = monthRange(monthRef.current)
      if (from) params.set('from', from)
      if (to) params.set('to', to)

      const [list, newest] = await Promise.all([
        api.get(`/api/system-health/node/${nodeId}/?${params.toString()}`),
        api.get(`/api/system-health/node/${nodeId}/?page_size=1`), // latest check, ignores filters
      ])
      if (mine !== requestId.current) return

      setLogs(list.results ?? [])
      setMatchCount(list.count ?? 0)
      if (list.summary) setSummary(list.summary)
      setLatest((newest.results ?? [])[0] ?? null)
      loadedOnce.current = true
    } catch {
      if (mine === requestId.current) setError(true)
    } finally {
      if (mine === requestId.current) {
        setLoading(false)
        setRefreshing(false)
        setFetching(false)
      }
    }
  }, [nodeId])

  useFocusEffect(useCallback(() => { fetchAll() }, [fetchAll]))

  const selectTab = (t: HealthTab) => {
    tabRef.current = t; pageRef.current = 1
    setTab(t); setPage(1); fetchAll()
  }
  const selectMonth = (m: string) => {
    monthRef.current = m; pageRef.current = 1
    setMonth(m); setPage(1); fetchAll()
  }
  const changePage = (p: number) => {
    pageRef.current = p
    setPage(p); fetchAll()
  }

  return {
    latest, logs, matchCount, summary, tab, month, page,
    totalPages: Math.ceil(matchCount / HEALTH_PAGE_SIZE),
    loading, refreshing, fetching, error,
    selectTab, selectMonth, changePage,
    refresh: () => fetchAll(true),
  }
}