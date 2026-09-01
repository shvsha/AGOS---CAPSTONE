"use client"

import { useLayoutEffect, useRef, useState, type DependencyList } from "react"

const RESERVED_PAGINATION_HEIGHT = 57

const FALLBACK_HEADER_HEIGHT = 40 // matches TableHead's default h-10

type UseFillRowsOptions = {
  rowHeight: number
  itemGap?: number
  initialRows?: number
  minRows?: number
  reservePaginationSpace?: boolean
  deps?: DependencyList
}

export function useFillRows({ rowHeight, itemGap = 0, initialRows, minRows = 3, reservePaginationSpace = true, deps = [], }: UseFillRowsOptions) {
  const panelRef = useRef<HTMLDivElement>(null)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState(initialRows ?? minRows)

  useLayoutEffect(() => {
    const panelEl = panelRef.current
    const tableWrapEl = tableWrapRef.current
    if (!panelEl || !tableWrapEl) return

    const recalc = () => {
      const panelRect = panelEl.getBoundingClientRect()
      const tableTop = tableWrapEl.getBoundingClientRect().top
      const theadEl = tableWrapEl.querySelector("thead")
      const headerHeight = theadEl?.getBoundingClientRect().height ?? 0
      const paginationReserve = reservePaginationSpace ? RESERVED_PAGINATION_HEIGHT : 0

      const availableForRows =
        panelRect.bottom - tableTop - headerHeight - RESERVED_PAGINATION_HEIGHT

      const nextRows = Math.max(minRows, Math.floor(availableForRows / (rowHeight + itemGap)))

      console.log({ panelBottom: panelRect.bottom, tableTop, headerHeight, availableForRows, nextRows })

      setRows(prev => (prev === nextRows ? prev : nextRows))
    }

    recalc()

    const observer = new ResizeObserver(recalc)
    observer.observe(panelEl)

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowHeight, itemGap, minRows, reservePaginationSpace, ...deps])

  return { panelRef, tableWrapRef, rows }
}