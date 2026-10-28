import { formatClock, parseLocal } from '@/lib/today/format'
import type { TodayData } from '@/lib/today/types'

export const ALI_NAME = 'Ali'

/** What Ali knows right now; each kind maps to a few lines he says in turn. New games add their own kinds here (plan 14). */
export type AliContext =
  | { kind: 'waiting' }
  | { kind: 'opening' }
  | { kind: 'claimed'; points: number; capped?: boolean; streak?: number }
  | { kind: 'done'; daysToWeekGift: number }
  | { kind: 'closed' }
  | { kind: 'error'; message: string }

/** The lines Ali says for a context, shown one after another; a reminder (class today, fee due...) joins them once the gift is taken. */
export function aliLines(ctx: AliContext, reminder?: string | null): string[] {
  const extra = reminder ? [reminder] : []
  switch (ctx.kind) {
    case 'waiting':
      return ['Nhanh tay mở hộp xem hôm nay có quà gì nào!', 'Chạm vào hộp quà đi, mình chờ nãy giờ nè!', ...extra]
    case 'opening':
      return ['Hộp quà đang rung rinh... chờ chút nhé!']
    case 'claimed': {
      const lines: string[] = []
      if (ctx.points > 0) lines.push(`Chúc mừng bạn đã nhận được ${ctx.points} anyPoint!`)
      if (ctx.capped) lines.push('Hôm nay quà hết phần rồi, mai quay lại nhé!')
      if (ctx.streak && ctx.streak > 1) lines.push(`Chuỗi ${ctx.streak} ngày liên tiếp rồi, giỏi quá!`)
      if (lines.length === 0) lines.push('Đã điểm danh hôm nay rồi nhé!')
      return [...lines, ...extra]
    }
    case 'done':
      return [
        'Hôm nay bạn nhận quà rồi nha!',
        ctx.daysToWeekGift > 0 ? `Còn ${ctx.daysToWeekGift} ngày nữa là tới quà ngày 7 đó!` : 'Tuần mới bắt đầu từ ngày mai, nhớ ghé thăm mình nhé!',
        ...extra,
      ]
    case 'closed':
      return ['Quà điểm danh đang nghỉ một chút, bạn quay lại sau nhé!']
    case 'error':
      return [ctx.message]
  }
}

const MINUTE = 60_000

/** The nearest class later today among the learners, as a friendly reminder for the parent; null when there is none. */
export function reminderFor(days: Pick<TodayData, 'learner' | 'nextSession'>[], now: Date): string | null {
  let best: { who: string; title: string; startAt: string; at: number } | null = null
  for (const day of days) {
    const session = day.nextSession
    if (!session) continue
    const at = parseLocal(session.startAt).getTime()
    if (at < now.getTime() || parseLocal(session.startAt).toDateString() !== now.toDateString()) continue
    if (!best || at < best.at) best = { who: day.learner.self ? 'Bạn' : `Bé ${day.learner.name}`, title: session.title, startAt: session.startAt, at }
  }
  if (!best) return null
  const minutes = Math.round((best.at - now.getTime()) / MINUTE)
  const clock = formatClock(best.startAt)
  return minutes <= 30
    ? `${best.who} sắp có lớp ${best.title} lúc ${clock} rồi, chuẩn bị thôi nào!`
    : `${best.who} có lớp ${best.title} lúc ${clock} hôm nay, đừng mải chơi mà quên giờ nhé!`
}
