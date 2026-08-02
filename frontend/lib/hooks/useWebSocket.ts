import { useEffect, useRef, useCallback } from "react"
import { getAccessToken } from "@/lib/auth"

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

    const wsBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/^http/, "ws")
    const ws = new WebSocket(`${wsBase}${path}`)
    wsRef.current = ws

    ws.onopen = () => {
      const token = getAccessToken()
      ws.send(JSON.stringify({ type: "auth", token }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === "auth_error") {
        ws.close()
        return
      }
      if (data.type === "auth_success") {
        reconnectDelayRef.current = BASE_RECONNECT_DELAY_MS  // connection is healthy again, reset backoff
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