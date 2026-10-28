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

/** The energy bar of the ranked game (plan 15): one point comes back every `regenMinutes`. */
export interface Energy { value: number; max: number; nextInSeconds: number; regenMinutes: number; cost: number }

export type PackType = 'level' | 'topic' | 'topic_level'

/** A training pack bought in the shop: `remaining` of `total` questions left, topics chosen when it is set up. */
export interface QuizPack {
  id: number
  type: PackType
  typeLabel: string
  difficulty: number | null
  difficultyLabel: string | null
  topic: string | null
  /** null = every topic (a level pack that was never set up or has every topic). */
  topics: string[] | null
  topicLabels: string[]
  total: number
  remaining: number
  /** A topic pack is usable only after its topic is chosen. */
  configured: boolean
  status: string
}

export interface QuizMe {
  enabled: boolean
  energy: Energy
  packs: QuizPack[]
  packSize: number
  /** The pack in use: the ready button says "Tập luyện" and questions come from it. */
  activePackId: number | null
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
  mode?: 'rank' | 'practice'
  pack?: QuizPack
  energy?: Energy
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
  /** A practice question: nothing changed for the rank; `pack` shows what is left of the pack. */
  practice?: boolean
  pack?: QuizPack
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

/** Saves the topics of a pack and switches it on; answers like `/quiz/me`. A level pack: none = every topic; the others: exactly one. */
export const saveQuizPack = (token: string, packId: number, topics: string[]) =>
  authFetch<QuizMe>(`/quiz/packs/${packId}`, token, { method: 'PUT', body: JSON.stringify({ topics }) })

/** Leaves practice mode; answers like `/quiz/me`. */
export const deactivateQuizPack = (token: string) => authFetch<QuizMe>('/quiz/packs/deactivate', token, { method: 'POST' })

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
