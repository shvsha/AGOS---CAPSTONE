"use client"

// auto refresh api to remove the manual refresh of fetching of data

import { useEffect, useRef, useCallback } from "react"

export function usePolling(callback: () => void | Promise<void>, intervalMs: number = 30000) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  const tick = useCallback(() => {
    savedCallback.current()
  }, [])

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (intervalId) return
      intervalId = setInterval(tick, intervalMs)
    }

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        tick()
        start()
      }
    }

    start()
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [intervalMs, tick])
}