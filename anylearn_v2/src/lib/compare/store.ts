import { useSyncExternalStore } from 'react'
import { parseStored, toggleEntry, type CompareEntry, type ToggleResult } from './selection'

const KEY = 'compare:v1'
const EMPTY: CompareEntry[] = []
let cache: CompareEntry[] | null = null
const listeners = new Set<() => void>()

function read(): CompareEntry[] {
  if (cache) return cache
  try {
    cache = parseStored(window.localStorage.getItem(KEY))
  } catch {
    cache = []
  }
  return cache
}

function write(list: CompareEntry[]) {
  cache = list
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* storage blocked: the list lives until the tab closes */ }
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return
    cache = null
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useCompareList(): CompareEntry[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

export function toggleCompare(entry: CompareEntry): ToggleResult {
  const result = toggleEntry(read(), entry)
  if (result.list !== read()) write(result.list)
  return result
}

export function removeCompare(id: number) {
  write(read().filter(entry => entry.id !== id))
}

export function clearCompare() {
  write([])
}
