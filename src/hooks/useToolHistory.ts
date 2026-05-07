import { useState } from 'preact/hooks'

export interface HistoryEntry {
  value: string
  label?: string
  timestamp: number
}

export function useToolHistory(key: string, maxItems = 20) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as HistoryEntry[]) : []
    } catch {
      return []
    }
  })

  const push = (entry: HistoryEntry) => {
    setHistory(prev => {
      const deduped = prev.filter(e => e.value !== entry.value)
      const next = [entry, ...deduped].slice(0, maxItems)
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const clear = () => {
    setHistory([])
    try {
      localStorage.removeItem(key)
    } catch {}
  }

  return { history, push, clear }
}
