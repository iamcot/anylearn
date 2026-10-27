// Home rows should not repeat a course the visitor has just seen in a row above.
export const ROW_SIZE = 8
// Fewer fresh courses than this and the row is hidden: a row of repeats is worse than no row.
export const MIN_FRESH = 4

// Fresh courses first (not in `exclude`), at most `size`. A row with too few fresh ones is empty.
export function pickFresh<T extends { id: number }>(items: T[], exclude: ReadonlySet<number>, size = ROW_SIZE, minFresh = MIN_FRESH): T[] {
  const fresh = items.filter(item => !exclude.has(item.id))
  if (exclude.size > 0 && fresh.length < minFresh) return []
  return fresh.slice(0, size)
}
