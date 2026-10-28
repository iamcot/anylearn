import type { Mission, MissionBonus } from '@/lib/api/fun'

/** "2 ngày 5 giờ", "5 giờ 10 phút" or "12 phút": the time left until the missions reset on Monday. */
export function countdownText(endsAt: string, now: number): string {
  const ms = new Date(endsAt).getTime() - now
  if (!Number.isFinite(ms) || ms <= 0) return 'sắp làm mới'
  const minutes = Math.floor(ms / 60_000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`
  if (hours > 0) return mins > 0 ? `${hours} giờ ${mins} phút` : `${hours} giờ`
  return `${Math.max(mins, 1)} phút`
}

export const isDone = (m: Pick<Mission, 'progress' | 'target'>) => m.target > 0 && m.progress >= m.target

export type MissionState = 'todo' | 'ready' | 'claimed'

export function missionState(m: Mission): MissionState {
  if (m.claimed) return 'claimed'
  return isDone(m) ? 'ready' : 'todo'
}

/** Width of the progress bar in percent (0 to 100). */
export function percent(m: Pick<Mission, 'progress' | 'target'>): number {
  if (m.target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((m.progress / m.target) * 100)))
}

export type BonusState = 'locked' | 'ready' | 'claimed'

export function bonusState(b: MissionBonus): BonusState {
  if (b.claimed) return 'claimed'
  return b.ready ? 'ready' : 'locked'
}

/** The line under the bonus: how many more missions open the sticker. */
export function bonusText(b: MissionBonus): string {
  if (b.claimed) return 'Bạn đã nhận sticker thưởng tuần này'
  if (b.ready) return 'Đủ nhiệm vụ rồi, nhận sticker thưởng nào!'
  const left = Math.max(b.needed - b.done, 0)
  return `Xong thêm ${left} nhiệm vụ để nhận 1 sticker miễn phí`
}
