import { formatClock, parseLocal } from '@/lib/today/format'
import type { TodayData } from '@/lib/today/types'

export const LEO_NAME = 'Leo'

/** What Leo knows right now; each kind maps to a few lines he says in turn. New games add their own kinds here (plan 14). */
export type LeoContext =
  | { kind: 'waiting' }
  | { kind: 'opening' }
  | { kind: 'claimed'; points: number; coinName?: string; capped?: boolean; streak?: number; sticker?: string }
  | { kind: 'done'; daysToWeekGift: number }
  | { kind: 'closed' }
  | { kind: 'error'; message: string }

/** What Leo may chat about: whether the player already played Leo rank today, and the name of a child when there is one. */
export interface LeoChat { playedToday?: boolean; childName?: string | null; seed?: number }

const CHAT_PICKS = 3

/** Small talk (a few lines, a different handful each day by `seed`): nothing here asks for anything, it only keeps Leo company. */
export function chatLines(chat: LeoChat = {}): string[] {
  const pool: string[] = [
    chat.playedToday === false ? 'Hôm nay bạn leo rank chưa? Vài câu thôi là có sao rồi đó!' : 'Hôm nay bạn leo rank rồi nè, giỏi ghê!',
    'Leo rank có mệt không bồ? Mệt thì nghỉ một chút rồi chơi tiếp nhé!',
    'Hôm nay của bạn thế nào? Kể mình nghe với!',
    'Uống miếng nước đi bồ, nhớ giữ sức khỏe nha!',
    'Mình thích nhất là lúc bạn đoán trúng liền một mạch!',
    'Sai một câu cũng không sao, học thêm được một điều mà!',
  ]
  if (chat.childName) {
    pool.push(`Hôm nay bé ${chat.childName} học có tốt không bạn?`, `Bé ${chat.childName} có kể gì ở lớp không? Hỏi bé một câu nhé!`)
  }
  const seed = Math.abs(Math.trunc(chat.seed ?? 0))
  const out: string[] = []
  for (let i = 0; i < Math.min(CHAT_PICKS, pool.length); i++) out.push(pool[(seed + i * 3) % pool.length])
  return [...new Set(out)]
}

/** The lines Leo says for a context, shown one after another; a reminder (class today, fee due...) joins them once the gift is taken. */
export function leoLines(ctx: LeoContext, reminder?: string | null, chat?: LeoChat): string[] {
  const extra = reminder ? [reminder] : []
  const talk = chat ? chatLines(chat) : []
  switch (ctx.kind) {
    case 'waiting':
      return ['Nhanh tay mở hộp xem hôm nay có quà gì nào!', 'Chạm vào hộp quà đi, mình chờ nãy giờ nè!', ...extra, ...talk.slice(0, 1)]
    case 'opening':
      return ['Hộp quà đang rung rinh... chờ chút nhé!']
    case 'claimed': {
      const lines: string[] = []
      if (ctx.points > 0) lines.push(`Chúc mừng bạn đã nhận được ${ctx.points} ${ctx.coinName ?? 'Leo Xu'}!`)
      if (ctx.sticker) lines.push(`Wow, bạn còn nhận thêm sticker ${ctx.sticker} nữa nè!`)
      if (ctx.capped) lines.push('Hôm nay quà hết phần rồi, mai quay lại nhé!')
      if (ctx.streak && ctx.streak > 1) lines.push(`Chuỗi ${ctx.streak} ngày liên tiếp rồi, giỏi quá!`)
      if (lines.length === 0) lines.push('Đã điểm danh hôm nay rồi nhé!')
      return [...lines, ...extra, ...talk]
    }
    case 'done':
      return [
        'Hôm nay bạn nhận quà rồi nha!',
        ctx.daysToWeekGift > 0 ? `Còn ${ctx.daysToWeekGift} ngày nữa là tới quà ngày 7 đó!` : 'Tuần mới bắt đầu từ ngày mai, nhớ ghé thăm mình nhé!',
        ...extra,
        ...talk,
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
