import type { ArenaBoardRow } from '@/lib/api/arena'

/** Before the first question people in the room come first, then those who only registered; each group keeps the server's order. */
export function roomFirst<T extends { inRoom: boolean }>(rows: T[]): T[] {
  return [...rows.filter(r => r.inRoom), ...rows.filter(r => !r.inRoom)]
}

/** The person's own line when it is not among the rows shown (so the page pins it at the bottom), else null. */
export function ownApart<T extends { me: boolean }>(rows: T[], me: T | null | undefined): T | null {
  if (!me) return null
  return rows.some(r => r.me) ? null : me
}

/** Total time of right answers as "30,5 giây"; nothing when the person has no right answer. */
export function secondsText(ms: number): string {
  if (!ms || ms <= 0) return ''
  return `${(ms / 1000).toFixed(1).replace('.', ',')} giây`
}

export type LiveRow = Pick<ArenaBoardRow, 'rank'>

/** Initial letter for the round avatar. */
export function initial(name: string): string {
  const word = name.trim().split(/\s+/).pop() ?? ''
  return (word[0] ?? '?').toUpperCase()
}

const COLORS = ['#ff8a5b', '#5b8cff', '#22b07d', '#c069ff', '#ffb020', '#ff5b8a', '#2fb5c9', '#8a6bff', '#e0663d', '#4caf50']

/** A steady colour for a name, so the same person keeps the same avatar. */
export function avatarColor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}
