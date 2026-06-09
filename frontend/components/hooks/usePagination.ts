import { useState, useMemo } from "react"

export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  // reset to page 1 whenever the list changes (e.g. after a filter)
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))
  const safePage   = Math.min(currentPage, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage
    return items.slice(start, start + itemsPerPage)
  }, [items, safePage, itemsPerPage])

  return {
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    paginated,
    totalItems: items.length,
    itemsPerPage,
  }
}