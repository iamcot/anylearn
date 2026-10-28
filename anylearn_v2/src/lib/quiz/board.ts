import type { BoardEntry, BoardType } from '@/lib/api/quiz'

export const BOARD_TABS: { type: BoardType; label: string }[] = [
  { type: 'rank', label: 'Cùng hạng' },
  { type: 'week', label: 'Tuần này' },
  { type: 'month', label: 'Tháng này' },
  { type: 'all', label: 'Mọi thời' },
]

/** What a line says about the person: the stars gained in the period, or the rank and stars they hold. */
export function scoreText(entry: BoardEntry, type: BoardType): string {
  if (type === 'week' || type === 'month') return `+${entry.netStars} sao`
  return `${entry.rankName} · ${entry.stars} sao`
}

/** `W2026-44` → "Tuần 44/2026", `M2026-10` → "Tháng 10/2026". */
export function periodLabel(period: string | null): string {
  const m = period?.match(/^([WM])(\d{4})-(\d{2})$/)
  if (!m) return ''
  return `${m[1] === 'W' ? 'Tuần' : 'Tháng'} ${Number(m[3])}/${m[2]}`
}

/** Short explanation under the tabs. */
export function boardHint(type: BoardType): string {
  switch (type) {
    case 'week': return 'Xếp theo số sao tăng ròng trong tuần (đúng cộng, sai trừ). Đặt lại vào thứ Hai, top 3 nhận vật phẩm.'
    case 'month': return 'Xếp theo số sao tăng ròng trong tháng. Đặt lại vào ngày 1, top 3 nhận vật phẩm và sticker.'
    case 'all': return 'Xếp theo hạng, rồi tới số sao.'
    default: return 'Những người cùng hạng, xếp theo số sao.'
  }
}

/** The own line is shown apart only when it is not already in the list. */
export function ownLineApart(entries: BoardEntry[], me: BoardEntry | null): BoardEntry | null {
  return me && !entries.some(e => e.me) ? me : null
}
