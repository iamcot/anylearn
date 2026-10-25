export const SEARCH_HISTORY_KEY = 'anylearn_searches'
const MAX_ENTRIES = 8

export function addSearchTerm(history: string[], term: string): string[] {
  const trimmed = term.trim()
  if (!trimmed) return history
  return [trimmed, ...history.filter(entry => entry !== trimmed)].slice(0, MAX_ENTRIES)
}

export function readSearchHistory(storage: Pick<Storage, 'getItem'>): string[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(SEARCH_HISTORY_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
  } catch {
    return []
  }
}
