/**
 * The timeline of one Đấu trường Leo session (plan 18), a copy of `ArenaRules.phaseAt` in the backend. Everything is in epoch
 * milliseconds of the SERVER clock: pass `phoneNow + offset` as `now` (see `clockOffset` in lib/quiz/rules.ts). The page changes
 * screens from this alone, so it never waits for a poll to move on. Question numbers start at 1.
 */
export interface ArenaTiming {
  startsAt: number
  openAt: number
  questionCount: number
  countdownSeconds: number
  answerSeconds: number
  revealSeconds: number
  gapSeconds: number
}

export type PhaseKind = 'before' | 'open' | 'countdown' | 'question' | 'reveal' | 'lobby' | 'ended'

export interface ArenaPhase {
  kind: PhaseKind
  /** The question on screen (countdown / question / reveal) or the one just finished (lobby); 0 before the first. */
  qNo: number
  /** The next question to come, 0 when none is left. */
  nextQNo: number
  /** Milliseconds to that next question. */
  msToNext: number
}

export function questionAt(t: ArenaTiming, qNo: number): number {
  return t.startsAt + (qNo - 1) * t.gapSeconds * 1000
}

export function answerEndsAt(t: ArenaTiming, qNo: number): number {
  return questionAt(t, qNo) + t.answerSeconds * 1000
}

export function endsAt(t: ArenaTiming): number {
  return answerEndsAt(t, t.questionCount) + t.revealSeconds * 1000
}

export function phaseAt(t: ArenaTiming, now: number): ArenaPhase {
  if (now < t.openAt) return { kind: 'before', qNo: 0, nextQNo: 1, msToNext: questionAt(t, 1) - now }
  if (now >= endsAt(t)) return { kind: 'ended', qNo: 0, nextQNo: 0, msToNext: 0 }
  for (let q = 1; q <= t.questionCount; q++) {
    const at = questionAt(t, q)
    const next = q < t.questionCount ? q + 1 : 0
    if (now < at - t.countdownSeconds * 1000) return { kind: q === 1 ? 'open' : 'lobby', qNo: q === 1 ? 0 : q - 1, nextQNo: q, msToNext: at - now }
    if (now < at) return { kind: 'countdown', qNo: q, nextQNo: q, msToNext: at - now }
    if (now < at + t.answerSeconds * 1000) return { kind: 'question', qNo: q, nextQNo: next, msToNext: next ? questionAt(t, next) - now : 0 }
    if (now < at + (t.answerSeconds + t.revealSeconds) * 1000) return { kind: 'reveal', qNo: q, nextQNo: next, msToNext: next ? questionAt(t, next) - now : 0 }
  }
  return { kind: 'ended', qNo: 0, nextQNo: 0, msToNext: 0 }
}

/** "4 phút 12 giây", and just "38 giây" under a minute. */
export function untilText(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return s >= 60 ? `${Math.floor(s / 60)} phút ${s % 60} giây` : `${s} giây`
}

/** "02:14:33" for the ticket stub. */
export function clockText(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

/** The line above the board: what the person is waiting for. */
export function nextLine(p: ArenaPhase): string {
  if (!p.nextQNo) return ''
  return `Còn ${untilText(p.msToNext)} tới câu hỏi ${p.nextQNo === 1 ? 'đầu tiên' : 'tiếp theo'}`
}

/** "hôm nay", "ngày mai" or "Thứ Sáu 30/10" for the day of a session, in the phone's calendar. */
export function dayLabel(startsAt: number, now: number): string {
  const day = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime() }
  const diff = Math.round((day(startsAt) - day(now)) / 86_400_000)
  if (diff === 0) return 'hôm nay'
  if (diff === 1) return 'ngày mai'
  const d = new Date(startsAt)
  const names = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return `${names[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

/** "20:00" from an epoch time. */
export function timeText(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
