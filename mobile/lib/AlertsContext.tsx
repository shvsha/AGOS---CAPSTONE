import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react'
import { api, BASE_URL, getAccessToken } from './api'
import { useAuth } from './AuthContext'

type AlertsContextType = {
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined)

const BASE_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30000
const SAFETY_POLL_INTERVAL_MS = 60000 // backstop in case the socket silently drops

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelayRef = useRef(BASE_RECONNECT_DELAY_MS)
  const safetyPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await api.get('/api/alerts/unread-count/')
      setUnreadCount(data.unread_count ?? 0)
    } catch {
      // network hiccup, keep showing the last known count
    }
  }, [])

  useEffect(() => {
    if (!user) {
      wsRef.current?.close()
      wsRef.current = null
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (safetyPollRef.current) clearInterval(safetyPollRef.current)
      setUnreadCount(0)
      return
    }

    refreshUnreadCount()
    safetyPollRef.current = setInterval(refreshUnreadCount, SAFETY_POLL_INTERVAL_MS)

    const connect = () => {
      const wsBase = BASE_URL.replace(/^http/, 'ws')
      const ws = new WebSocket(`${wsBase}/ws/alerts/`)
      wsRef.current = ws

      ws.onopen = async () => {
        const token = await getAccessToken()
        ws.send(JSON.stringify({ type: 'auth', token }))
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'auth_error') {
          ws.close()
          return
        }
        if (data.type === 'auth_success') {
          reconnectDelayRef.current = BASE_RECONNECT_DELAY_MS
          refreshUnreadCount() // catch up on anything missed while disconnected
          return
        }
        // any other message = a new alert came in — recheck the (properly-scoped) count
        refreshUnreadCount()
      }

      ws.onclose = () => {
        wsRef.current = null
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelayRef.current)
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY_MS)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      wsRef.current?.close()
      wsRef.current = null
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (safetyPollRef.current) clearInterval(safetyPollRef.current)
    }
  }, [user, refreshUnreadCount])

  return (
    <AlertsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </AlertsContext.Provider>
  )
}

export function useAlertsContext() {
  const ctx = useContext(AlertsContext)
  if (!ctx) throw new Error('useAlertsContext must be used inside an AlertsProvider')
  return ctx
}