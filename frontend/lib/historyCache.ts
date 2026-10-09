export type HistoryEntry<T = any> = {
  rows: T[]
  hasNext: boolean
  hasPrev: boolean
}

const store = new Map<string, HistoryEntry>()

export const historyCache = {
  get<T = any>(key: string): HistoryEntry<T> | undefined {
    return store.get(key) as HistoryEntry<T> | undefined
  },
  set<T = any>(key: string, entry: HistoryEntry<T>) {
    store.set(key, entry)
  },
  invalidate(prefix: string) {
    for (const k of store.keys()) {
      if (k.startsWith(prefix)) store.delete(k)
    }
  },
}