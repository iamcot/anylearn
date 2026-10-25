'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { SEARCH_HISTORY_KEY, addSearchTerm, readSearchHistory } from '@/lib/search/history'

const CHANGE_EVENT = 'anylearn-search-history'
const EMPTY = '[]'

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function readRaw(): string {
  try {
    return localStorage.getItem(SEARCH_HISTORY_KEY) ?? EMPTY
  } catch {
    return EMPTY
  }
}

function writeHistory(history: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useSearchHistory() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY)
  const history = useMemo(() => readSearchHistory({ getItem: () => raw }), [raw])

  const remember = useCallback((term: string) => {
    writeHistory(addSearchTerm(readSearchHistory({ getItem: () => readRaw() }), term))
  }, [])
  const clear = useCallback(() => writeHistory([]), [])

  return { history, remember, clear }
}
