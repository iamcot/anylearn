const pad = (n: number) => String(n).padStart(2, '0')

/** Hour:minute today, otherwise day/month; empty for no date. */
export function formatChatTime(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
}

/** Label of the day divider between messages. */
export function chatDayLabel(value: string, now: Date = new Date()): string {
  const date = new Date(value)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === now.toDateString()) return 'Hôm nay'
  if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua'
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** Keeps messages ordered by id and drops duplicates (a poll and a live event can bring the same one). */
export function mergeMessages<T extends { id: number }>(current: T[], incoming: T[]): T[] {
  const byId = new Map<number, T>()
  for (const m of current) byId.set(m.id, m)
  for (const m of incoming) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}
