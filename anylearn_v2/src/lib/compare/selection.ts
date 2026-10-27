/** The courses a parent put in the comparison (plan 04.6): picked by hand, at most three, kept in the browser. */
export const MAX_COMPARE = 3

export interface CompareEntry { id: number; title: string; image?: string | null }

export type ToggleResult = { list: CompareEntry[]; added: boolean; full: boolean }

/** Adds the course, or removes it when already there. A fourth course is refused (`full`) so the parent chooses what to drop. */
export function toggleEntry(list: CompareEntry[], entry: CompareEntry): ToggleResult {
  if (list.some(item => item.id === entry.id)) return { list: list.filter(item => item.id !== entry.id), added: false, full: false }
  if (list.length >= MAX_COMPARE) return { list, added: false, full: true }
  return { list: [...list, entry], added: true, full: false }
}

/** Reads the stored list; anything that is not a list of entries gives an empty one. */
export function parseStored(raw: string | null): CompareEntry[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    const entries: CompareEntry[] = []
    for (const row of data) {
      if (entries.length >= MAX_COMPARE) break
      if (row && typeof row === 'object' && Number.isInteger((row as CompareEntry).id) && typeof (row as CompareEntry).title === 'string'
        && !entries.some(entry => entry.id === (row as CompareEntry).id)) {
        const { id, title, image } = row as CompareEntry
        entries.push({ id, title, image: typeof image === 'string' ? image : null })
      }
    }
    return entries
  } catch {
    return []
  }
}

/** Ids from `?ids=1,2,3` (the link a parent can share); junk and repeats are skipped. */
export function idsFromQuery(raw: string | null | undefined): number[] {
  const ids: number[] = []
  for (const part of (raw ?? '').split(',')) {
    const id = Number(part.trim())
    if (Number.isInteger(id) && id > 0 && !ids.includes(id) && ids.length < MAX_COMPARE) ids.push(id)
  }
  return ids
}
