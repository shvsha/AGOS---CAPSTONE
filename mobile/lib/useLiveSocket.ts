import { useEffect, useRef, useState, useCallback } from 'react'
import { getAccessToken, BASE_URL } from './api'

const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws')
const POLL_INTERVAL_MS = 30000
const MAX_RECONNECT_DELAY_MS = 30000

export type LiveConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function useLiveSocket<T = any>(
  path: string,
  onMessage: (data: T) => void,
  pollFn?: () => void
) {
  const [status, setStatus] = useState<LiveConnectionStatus>('connecting')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempt = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  // keep latest callbacks without re-triggering the connect effect
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage
  const pollFnRef = useRef(pollFn)
  pollFnRef.current = pollFn

  const startPolling = useCallback(() => {
    if (pollTimer.current || !pollFnRef.current) return
    pollTimer.current = setInterval(() => {
      pollFnRef.current?.()
    }, POLL_INTERVAL_MS)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  const connect = useCallback(async () => {
    if (!mountedRef.current) return
    setStatus('connecting')
    startPolling() // fallback runs until we confirm we're actually connected

    const token = await getAccessToken()
    if (!token || !mountedRef.current) return

    const ws = new WebSocket(`${WS_BASE_URL}/${path}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = (event) => {
      let data: any
      try {
        data = JSON.parse(event.data)
      } catch {
        return // ignore malformed payloads
      }

      if (data.type === 'auth_success') {
        reconnectAttempt.current = 0
        setStatus('connected')
        stopPolling()
        return
      }
      if (data.type === 'auth_error') {
        ws.close()
        return
      }
      onMessageRef.current(data)
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      setStatus('disconnected')
      startPolling()

      const delay = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** reconnectAttempt.current)
      reconnectAttempt.current += 1
      reconnectTimer.current = setTimeout(connect, delay)
    }

    // onerror is always followed by onclose, which handles reconnection —
    // nothing extra to do here
    ws.onerror = () => {}
  }, [path, startPolling, stopPolling])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      stopPolling()
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect, stopPolling])

  return { status }
}