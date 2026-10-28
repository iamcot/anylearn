import type { ItemKey, QuizProfile, QuizResult } from '@/lib/api/quiz'

export const BEFORE_ITEMS: ItemKey[] = ['mult2', 'mult3', 'shield', 'topic']
export const DURING_ITEMS: ItemKey[] = ['fifty', 'community', 'time', 'swap']

export const ITEM_HINT: Record<ItemKey, string> = {
  mult2: 'Đúng thì được +2 sao',
  mult3: 'Đúng thì được +3 sao',
  shield: 'Sai không mất sao hay bảo hộ',
  topic: 'Chọn chủ đề của câu hỏi',
  fifty: 'Bỏ đi 2 đáp án sai',
  community: 'Xem mọi người hay chọn gì',
  time: 'Thêm 15 giây',
  swap: 'Đổi sang câu khác cùng độ khó',
}

/** Milliseconds left, using the server's clock: `offset` = serverNow - phone's now, measured when the question arrived. */
export function remainingMs(expiresAt: number, offset: number, phoneNow: number): number {
  return Math.max(expiresAt - (phoneNow + offset), 0)
}

/** Server clock minus the phone's clock at this moment; call it when a question arrives. */
export function clockOffset(serverNow: number): number {
  return serverNow - Date.now()
}

export function secondsLeft(ms: number): number {
  return Math.ceil(ms / 1000)
}

/** Share (0..100) of the bar the stars fill; the top rank has no ceiling so its bar stays full. */
export function starPercent(stars: number, needed: number): number {
  if (needed <= 0) return 100
  return Math.min(Math.max((stars / needed) * 100, 0), 100)
}

/** Picks one of mult2 / mult3: choosing one drops the other. */
export function toggleMult(current: ItemKey | null, item: ItemKey): ItemKey | null {
  return current === item ? null : item
}

/** One line about the stars of a finished question. */
export function starsLine(result: QuizResult): string {
  if (result.shieldUsed) return 'Khiên đã bảo vệ bạn, không mất sao'
  if (result.correct) return `+${result.starsGained} sao`
  if (result.rankedDown) return 'Rớt xuống hạng dưới'
  if (result.guardLost) return 'Mất bảo hộ đầu hạng'
  if (result.starsGained < 0) return `${result.starsGained} sao`
  return 'Không mất sao'
}

/** The warning shown only when the next miss would drop the rank. */
export function guardWarning(profile: QuizProfile): string | null {
  return profile.rank > 0 && profile.stars === 0 && !profile.guard ? 'Hết bảo hộ, sai nữa sẽ rớt hạng. Hãy cân nhắc dùng Khiên bảo hộ.' : null
}

export function resultTitle(result: QuizResult): string {
  if (result.outcome === 'timeout') return 'Hết giờ rồi'
  if (result.outcome === 'forfeit') return 'Câu bỏ dở tính là sai'
  return result.correct ? 'Chính xác!' : 'Chưa đúng rồi'
}

export const RANK_COLORS: Record<string, [string, string]> = {
  dong: ['#d9915a', '#8a4b22'],
  bac: ['#cfd8e3', '#7d8b9b'],
  vang: ['#ffd84d', '#c98a00'],
  bachkim: ['#9fe3f2', '#2f8fa8'],
  kimcuong: ['#7fb0ff', '#2b5fd9'],
  thongthai: ['#b794ff', '#6d3fd1'],
  sieupham: ['#ff8fc7', '#c2287a'],
  huyenthoai: ['#ff9b7a', '#d92b2b'],
}
