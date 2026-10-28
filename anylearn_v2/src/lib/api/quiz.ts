import { authFetch } from './client'
import type { StickerView } from './stickers'

export type ItemKey = 'mult2' | 'mult3' | 'shield' | 'topic' | 'fifty' | 'community' | 'time' | 'swap'

export interface QuizItemRow { key: ItemKey; label: string; phase: 'before' | 'during'; qty: number; cap: number; price: number }

export interface QuizProfile {
  rank: number
  rankName: string
  rankKey: string
  stars: number
  /** Stars to leave this rank; 0 = no ceiling (the top rank). */
  needed: number
  guard: boolean
  streak: number
  bestRank: number
  bestRankName: string
  games: number
  correct: number
  wrong: number
  ranks: { key: string; name: string; needed: number }[]
}

export interface QuizMe {
  enabled: boolean
  coinName: string
  coins: number
  profile: QuizProfile
  items: Partial<Record<ItemKey, number>>
  itemList: QuizItemRow[]
  boxReady: boolean
  hideBoard?: boolean
  topics: { key: string; label: string }[]
  seconds: number
  buyLeft: number
  today: { games: number; correct: number }
  forfeited?: QuizResult
}

export interface QuizQuestion {
  attemptId: number
  topic: string
  topicLabel: string
  body: string
  options: string[]
  hidden: number[]
  community: number[] | null
  /** Epoch ms on the server's clock; compare with `serverNow`, not with the phone's clock. */
  expiresAt: number
  serverNow: number
  used: ItemKey[]
  items: Partial<Record<ItemKey, number>>
}

export interface QuizResult {
  correct: boolean
  outcome: 'correct' | 'wrong' | 'timeout' | 'forfeit'
  correctIndex: number
  chosen: number | null
  explanation: string | null
  starsGained: number
  rankedUp: boolean
  rankedDown: boolean
  guardLost: boolean
  shieldUsed: boolean
  multiplier: number
  starsBefore: number
  rankBefore: number
  reward: { coins?: number; shield?: number; sticker?: StickerView }
  /** Token of the shareable banner of a new rank, when one was made. */
  achievement?: string | null
  drop: ItemKey | null
  dropLabel: string | null
  profile: QuizProfile
  items: Partial<Record<ItemKey, number>>
  coins: number
}

export const getQuizMe = (token: string) => authFetch<QuizMe>('/quiz/me', token)

export const startQuiz = (token: string, body: { mult?: ItemKey | null; shield?: boolean; topic?: string | null }) =>
  authFetch<QuizQuestion>('/quiz/start', token, { method: 'POST', body: JSON.stringify(body) })

export const playLifeline = (token: string, attemptId: number, item: ItemKey) =>
  authFetch<QuizQuestion>('/quiz/lifeline', token, { method: 'POST', body: JSON.stringify({ attemptId, item }) })

export const answerQuiz = (token: string, attemptId: number, option: number | null, away: boolean) =>
  authFetch<QuizResult>('/quiz/answer', token, { method: 'POST', body: JSON.stringify({ attemptId, option, away }) })

export const openQuizBox = (token: string) =>
  authFetch<{ given: ItemKey[]; items: Partial<Record<ItemKey, number>> }>('/quiz/box/open', token, { method: 'POST' })

export const buyQuizItem = (token: string, item: ItemKey) =>
  authFetch<{ items: Partial<Record<ItemKey, number>>; coins: number; buyLeft: number }>('/quiz/items/buy', token, { method: 'POST', body: JSON.stringify({ item }) })

export type BoardType = 'rank' | 'week' | 'month' | 'all'

export interface BoardEntry {
  place: number
  name: string
  rankKey: string
  rankName: string
  stars: number
  netStars: number
  me: boolean
}

export interface Board {
  type: BoardType
  /** `W2026-44` or `M2026-10` for the week and month boards. */
  period: string | null
  rank: number | null
  entries: BoardEntry[]
  me: BoardEntry | null
  hidden: boolean
}

export const getQuizBoard = (token: string, type: BoardType, rank?: number) =>
  authFetch<Board>(`/quiz/leaderboard?type=${type}${rank !== undefined ? `&rank=${rank}` : ''}`, token)

export const setBoardHidden = (token: string, hidden: boolean) =>
  authFetch<{ hidden: boolean }>('/quiz/board/visibility', token, { method: 'POST', body: JSON.stringify({ hidden }) })
