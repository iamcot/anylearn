import { formatClock, parseLocal } from '@/lib/today/format'
import type { TodayData } from '@/lib/today/types'

export const LEO_NAME = 'Leo'

/** What Leo knows right now; each kind maps to a few lines he says in turn. New games add their own kinds here (plan 14). */
export type LeoContext =
  | { kind: 'waiting' }
  | { kind: 'opening' }
  | { kind: 'claimed'; points: number; coinName?: string; capped?: boolean; streak?: number; sticker?: string; item?: string }
  | QuizLobbyContext
  | QuizResultContext
  | { kind: 'done'; daysToWeekGift: number }
  | { kind: 'closed' }
  | { kind: 'error'; message: string }

/** What Leo may chat about: whether the player already played Leo rank today, and the name of a child when there is one. */
export interface LeoChat { playedToday?: boolean; childName?: string | null; seed?: number }

/** Leo in the lobby of Leo rank: what is true right now, most important first (see {@link quizLobbyLines}). */
export interface QuizLobbyContext {
  kind: 'quizLobby'
  /** The star bar of the rank is full: the next right answer promotes. */
  nearRankUp?: boolean
  /** Energy left, when the server sends it; 3 or less counts as low. */
  energy?: number | null
  boxReady?: boolean
  /** A training pack is in use. */
  practice?: boolean
  streak?: number
  rankName?: string
  seed?: number
}

/** Leo on the result page of a question. */
export interface QuizResultContext {
  kind: 'quizResult'
  correct: boolean
  timeout?: boolean
  streak?: number
  rankedUp?: boolean
  rankedDown?: boolean
  rankName?: string
  /** A star was lost (wrong answer with a negative star change). */
  lostStar?: boolean
  guardLost?: boolean
  shieldUsed?: boolean
  practice?: boolean
}

export const LOW_ENERGY = 3
/** Right answers in a row from which Leo cheers the streak. */
export const STREAK_CHEER = 3

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
      if (ctx.item) lines.push(`Hôm nay còn có thêm vật phẩm ${ctx.item} cho Leo rank nữa đó!`)
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
    case 'quizLobby':
      return quizLobbyLines(ctx)
    case 'quizResult':
      return quizResultLines(ctx)
  }
}

/** Leo in the Leo rank lobby: the most useful thing first (about to rank up, low energy, a gift waiting, training), then greetings. */
export function quizLobbyLines(ctx: QuizLobbyContext): string[] {
  const lines: string[] = []
  if (ctx.nearRankUp) lines.push(`Thanh sao đầy rồi! Đúng thêm một câu là lên hạng${ctx.rankName ? ' sau ' + ctx.rankName : ''} đó!`)
  if (ctx.energy != null && ctx.energy <= LOW_ENERGY) {
    lines.push(ctx.energy <= 0 ? 'Hết năng lượng rồi, nghỉ một chút hoặc tập luyện nhé!' : `Năng lượng còn ${ctx.energy} thôi, tập luyện không tốn năng lượng đâu nè!`)
  }
  if (ctx.boxReady) lines.push('Có hộp quà khởi động đang chờ bạn đó, mở ra xem nào!')
  if (ctx.practice) lines.push('Đang tập luyện nè, thoải mái thử sức nha, không sợ mất sao đâu!')
  if (ctx.streak && ctx.streak >= STREAK_CHEER) lines.push(`Đang đúng liền ${ctx.streak} câu rồi, giữ phong độ nhé!`)
  const greetings = ['Chào bạn! Sẵn sàng leo rank cùng mình chưa?', 'Chọn vật phẩm rồi bấm Sẵn sàng nhé, mình cổ vũ bạn!', 'Mỗi câu đúng là thêm một bước lên hạng cao hơn đó!']
  const seed = Math.abs(Math.trunc(ctx.seed ?? 0))
  lines.push(greetings[seed % greetings.length])
  return lines
}

/** Leo after a question: one main line for what happened, then the extras that matter. */
export function quizResultLines(ctx: QuizResultContext): string[] {
  const lines: string[] = []
  if (ctx.rankedUp) lines.push(`Lên hạng${ctx.rankName ? ' ' + ctx.rankName : ''} rồi! Mình tự hào về bạn lắm!`)
  else if (ctx.rankedDown) lines.push('Rớt xuống hạng dưới rồi, nhưng đừng buồn, leo lại thôi nào!')
  else if (ctx.shieldUsed) lines.push('Khiên đã cứu bạn rồi, không mất gì hết!')
  else if (ctx.guardLost) lines.push('Mất bảo hộ đầu hạng rồi, cẩn thận câu sau nhé!')
  else if (ctx.lostStar) lines.push('Mất một sao rồi, không sao, lấy lại ngay thôi!')
  else if (ctx.correct && ctx.streak && ctx.streak >= STREAK_CHEER) lines.push(`Đúng liền ${ctx.streak} câu luôn, bạn siêu quá!`)
  else if (ctx.correct) lines.push(ctx.practice ? 'Đúng rồi, tập luyện tốt lắm!' : 'Chính xác! Giỏi lắm bạn ơi!')
  else if (ctx.timeout) lines.push('Hết giờ mất rồi, câu sau nhanh tay hơn nhé!')
  else lines.push(ctx.practice ? 'Chưa đúng, xem giải thích rồi nhớ lần sau nhé!' : 'Chưa đúng, đọc giải thích rồi thử lại nhé!')
  if (ctx.rankedUp && ctx.correct && ctx.streak && ctx.streak >= STREAK_CHEER) lines.push(`Còn đang đúng liền ${ctx.streak} câu nữa đó!`)
  return lines
}

/** The lobby context from what `/quiz/me` says; `energy` and `activePackId` may be missing on an older server. */
export function quizLobbyContext(me: {
  profile: { stars: number; needed: number; streak: number; rankName: string }
  boxReady: boolean
  energy?: unknown
  activePackId?: unknown
}, seed = 0): QuizLobbyContext {
  return {
    kind: 'quizLobby',
    nearRankUp: me.profile.needed > 0 && me.profile.stars >= me.profile.needed,
    energy: energyValue(me.energy),
    boxReady: me.boxReady,
    practice: me.activePackId != null && me.activePackId !== 0 && me.activePackId !== false,
    streak: me.profile.streak,
    rankName: me.profile.rankName,
    seed,
  }
}

/** A number, or the current value of an energy object; null when the server does not send energy. */
export function energyValue(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    for (const key of ['current', 'value', 'energy']) if (typeof o[key] === 'number') return o[key] as number
  }
  return null
}

export function quizResultContext(result: {
  correct: boolean; outcome: string; starsGained: number; rankedUp: boolean; rankedDown: boolean; guardLost: boolean; shieldUsed: boolean
  profile: { streak: number; rankName: string }
}, practice = false): QuizResultContext {
  return {
    kind: 'quizResult',
    correct: result.correct,
    timeout: result.outcome === 'timeout',
    streak: result.profile.streak,
    rankedUp: result.rankedUp,
    rankedDown: result.rankedDown,
    rankName: result.profile.rankName,
    lostStar: !result.correct && result.starsGained < 0,
    guardLost: result.guardLost,
    shieldUsed: result.shieldUsed,
    practice,
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
