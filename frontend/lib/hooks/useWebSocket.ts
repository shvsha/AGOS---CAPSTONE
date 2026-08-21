import { useEffect, useRef, useCallback } from "react"

type UseWebSocketOptions = {
  path: string
  onMessage: (data: any) => void
  enabled?: boolean
}

const BASE_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30000

export function useWebSocket({ path, onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelayRef = useRef(BASE_RECONNECT_DELAY_MS)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (!enabled) return

    const wsBase = (process.env.NEXT_PUBLIC_WS_URL ?? "").replace(/^http/, "ws")
    const ws = new WebSocket(`${wsBase}${path}`)
    wsRef.current = ws

    ws.onopen = async () => {
      try {
        const res = await fetch("/api/auth/ws-token/", { credentials: "include" })
        if (!res.ok) return ws.close()
        const { token } = await res.json()
        ws.send(JSON.stringify({ type: "auth", token }))
      } catch {
        ws.close()
      }
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === "auth_error") {
        ws.close()
        return
      }
      if (data.type === "auth_success") {
        reconnectDelayRef.current = BASE_RECONNECT_DELAY_MS
        return
      }

      onMessageRef.current(data)
    }

    ws.onclose = () => {
      wsRef.current = null
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelayRef.current)
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY_MS)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [path, enabled])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      wsRef.current?.close()
    }
  }, [connect])
}