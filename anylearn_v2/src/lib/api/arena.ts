import { authFetch } from './client'

/** Numbers for the "Đấu trường Leo là gì?" sheet. */
export interface ArenaRules {
  startTime: string
  questionCount: number
  answerSeconds: number
  openMinutes: number
  rewardCoins: number[]
  rewardSticker: boolean
  rewardMinScore: number
  rewardParticipation: number
  coinName: string
}

export interface ArenaTimingFields {
  sessionId: number
  day: string
  startsAt: number
  openAt: number
  questionCount: number
  countdownSeconds: number
  answerSeconds: number
  revealSeconds: number
  gapSeconds: number
}

/** The "đấu trường riêng" the back office runs by hand. `startsAt` is null until it is started (then it is a minute away). */
export interface ArenaCustomBanner extends Partial<Omit<ArenaTimingFields, 'sessionId' | 'startsAt'>> {
  sessionId: number
  title: string
  status: string
  waiting: boolean
  startsAt: number | null
  /** The time the back office announced, or null. */
  expectedAt: number | null
  phase?: ArenaPhaseDto
  inRoomCount?: number
  rules?: { title: string; questionCount: number; answerSeconds: number; expectedAt: number | null }
}

export interface ArenaPhaseDto { kind: string; qNo: number; nextQNo: number; millisToNext: number }

export interface ArenaBanner extends Partial<Omit<ArenaTimingFields, 'sessionId'>> {
  serverNow: number
  enabled: boolean
  sessionId?: number | null
  status?: string
  phase?: ArenaPhaseDto
  registeredCount?: number
  inRoomCount?: number
  registered?: boolean
  inRoom?: boolean
  /** The session that ended today (the banner offers its result), or null. */
  endedSessionId?: number | null
  rules?: ArenaRules
  /** The custom arena, or null / absent when there is none. */
  custom?: ArenaCustomBanner | null
}

export type ArenaCustomRules = NonNullable<ArenaCustomBanner['rules']>

export interface ArenaBoardRow {
  rank: number
  name: string
  score?: number
  correctMs?: number
  lastCorrect?: boolean
  inRoom: boolean
  status?: 'in_room' | 'registered' | 'away'
  me: boolean
}

export interface ArenaMe { name: string; rank: number | null; score: number; correctMs: number; lastCorrect?: boolean }

export interface ArenaLobby extends Partial<Omit<ArenaTimingFields, 'sessionId' | 'startsAt'>> {
  serverNow: number
  startsAt?: number | null
  /** The custom arena was closed by the back office: leave. */
  closed?: boolean
  custom?: boolean
  title?: string
  waiting?: boolean
  expectedAt?: number | null
  endedSessionId?: number | null
  sessionId?: number | null
  phase?: ArenaPhaseDto
  rules?: ArenaRules | ArenaCustomRules
  /** False before the first question is over: the board then lists who is in the room or registered. */
  started?: boolean
  lastFinished?: number
  board?: ArenaBoardRow[]
  me?: ArenaMe | null
  counts?: { inRoom: number; registered: number }
  registered?: boolean
}

export interface ArenaQuestion {
  serverNow: number
  qNo: number
  questionCount: number
  topicLabel: string
  levelLabel: string
  body: string
  options: string[]
  startsAt: number
  expiresAt: number
  over: boolean
  answeredCount: number
  inRoom: number
  mine?: { option?: number; correct?: boolean }
  /** Only after the time of the question is up. */
  rightOption?: number
  explanation?: string | null
}

export interface ArenaResultRow { rank: number; name: string; score: number; correctMs: number; rewardCoins: number; me: boolean }

export interface ArenaResultBoard {
  serverNow: number
  days: { id: number; day: string }[]
  session: { id: number; day: string; questionCount: number; players: number; custom?: boolean; title?: string } | null
  /** The session is known but its final ranking is not ready yet. */
  pending?: boolean
  custom?: boolean
  title?: string
  rules?: ArenaRules
  rows?: ArenaResultRow[]
  me?: { name: string; rank: number; score: number; correctMs: number; rewardCoins: number }
}

export function getArenaBanner(token: string) {
  return authFetch<ArenaBanner>('/arena/banner', token)
}

export function registerArena(token: string, sessionId: number) {
  return authFetch<{ registered: boolean; registeredCount: number }>('/arena/register', token, { method: 'POST', body: JSON.stringify({ sessionId }) })
}

export function unregisterArena(token: string, sessionId: number) {
  return authFetch<{ registered: boolean; registeredCount: number }>(`/arena/register?sessionId=${sessionId}`, token, { method: 'DELETE' })
}

export function getArenaLobby(token: string, customId?: number) {
  return authFetch<ArenaLobby>(`/arena/lobby${customId ? `?sessionId=${customId}` : ''}`, token, { method: 'POST' })
}

export function getArenaCustomState(token: string, sessionId: number) {
  return authFetch<{ serverNow: number; closed: boolean }>(`/arena/custom-state?sessionId=${sessionId}`, token)
}

export function getArenaQuestion(token: string, sessionId: number, qNo: number) {
  return authFetch<ArenaQuestion>(`/arena/question?sessionId=${sessionId}&qNo=${qNo}`, token)
}

export function answerArena(token: string, sessionId: number, qNo: number, option: number, away: boolean) {
  return authFetch<{ accepted: boolean; option: number }>('/arena/answer', token, { method: 'POST', body: JSON.stringify({ sessionId, qNo, option, away }) })
}

export function getArenaBoard(token: string, sessionId?: number) {
  return authFetch<ArenaResultBoard>(`/arena/board${sessionId ? `?sessionId=${sessionId}` : ''}`, token)
}
