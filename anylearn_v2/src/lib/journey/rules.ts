import type { Journey, JourneyChapter, Reward } from '@/lib/api/gamification'

/** The app asks the server to pay ready missions at most this often (on page changes). */
export const CLAIM_EVERY_MS = 60_000

/** True when the last claim is old enough for another one. */
export function claimDue(lastAt: number | null, now: number, every = CLAIM_EVERY_MS): boolean {
  return lastAt == null || now - lastAt >= every
}

/** Required missions done of a chapter, as a 0-100 percent (a chapter without required missions is 100 once complete). */
export function chapterPercent(ch: Pick<JourneyChapter, 'required' | 'requiredDone' | 'complete'>): number {
  if (ch.required <= 0) return ch.complete ? 100 : 0
  return Math.round(Math.min(ch.requiredDone, ch.required) * 100 / ch.required)
}

/** The chapter to show on the small card: the first open one not paid yet, else the last open one. */
export function currentChapter(journey: Pick<Journey, 'chapters'>): JourneyChapter | null {
  const open = journey.chapters.filter(c => c.open)
  return open.find(c => !c.claimed) ?? open[open.length - 1] ?? journey.chapters[0] ?? null
}

/** Chapters paid out of all chapters. */
export function chaptersDone(journey: Pick<Journey, 'chapters'>): number {
  return journey.chapters.filter(c => c.claimed).length
}

/** The lines Leo says when he hands a reward over (title + what it gave). */
export function rewardLines(r: Reward, coinName: string): { title: string; gifts: string[] } {
  const gifts: string[] = []
  if (r.coins && r.coins > 0) gifts.push(`+${r.coins} ${coinName}`)
  if (r.points && r.points > 0) gifts.push(`+${r.points} anyPoint`)
  if (r.sticker) gifts.push(`Sticker ${r.sticker.name ?? 'mới'}`)
  if (r.foundation && r.foundation > 0) gifts.push(`Góp ${r.foundationLabel ?? 'gạch'} cho anyLEARN Foundation`)
  if (r.achievement) gifts.push('Huy hiệu thành tích mới')
  if (r.vouchers && r.vouchers > 0) gifts.push(r.vouchers > 1 ? `${r.vouchers} voucher` : '1 voucher')
  const title = r.kind === 'chapter' ? `Hoàn thành chương! ${r.label.replace(/^Xong chương \d+: /, '')}`
    : r.kind === 'order' ? r.label
      : r.kind === 'quiz' ? r.label
        : `Xong nhiệm vụ: ${r.label}`
  return { title, gifts }
}

/** Order rewards of `GET /order/{id}` as Leo rewards. */
export function orderRewards(rows: { kind: string; points: number; coins: number }[] | null | undefined): Reward[] {
  return (rows ?? []).filter(r => (r.points ?? 0) > 0 || (r.coins ?? 0) > 0).map(r => ({
    kind: 'order' as const,
    key: `order:${r.kind}`,
    label: r.kind === 'first_order' ? 'Quà đơn hàng đầu tiên' : 'Quà mua đơn đầu qua lời mời',
    coins: r.coins,
    points: r.points,
  }))
}
