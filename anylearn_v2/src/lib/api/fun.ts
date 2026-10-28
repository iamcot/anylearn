import { authFetch } from './client'
import type { StickerView } from './stickers'

export interface CheckinDay { day: number; points: number; state: 'done' | 'today' | 'todo' }

export interface CheckinStatus {
  enabled: boolean
  today: string
  claimedToday: boolean
  streak: number
  best: number
  dayInCycle: number
  nextPoints: number | null
  /** Balance of the game currency (not anyPoint) and its name. */
  coins: number
  coinName: string
  days: CheckinDay[]
}

export interface CheckinClaim {
  alreadyClaimed: boolean
  points: number
  capped?: boolean
  streak?: number
  dayInCycle?: number
  sticker?: StickerView | null
  /** Token of a streak banner, when this claim reached a milestone. */
  achievement?: string | null
  coins?: number
  coinName?: string
}

export interface CoinHistoryRow { id: number; delta: number; balanceAfter: number; source: string; detail: string | null; createdAt: string }
export interface CoinWallet { coinName: string; balance: number; history: CoinHistoryRow[] }

export interface CoinHistoryPage { coinName: string; balance: number; items: CoinHistoryRow[]; total: number; page: number; size: number }

export function getCoinHistory(token: string, page: number, size = 20) {
  return authFetch<CoinHistoryPage>(`/fun/coins/history?page=${page}&size=${size}`, token)
}

export function getCoins(token: string) {
  return authFetch<CoinWallet>('/fun/coins', token)
}

export function getCheckin(token: string) {
  return authFetch<CheckinStatus>('/fun/checkin', token)
}

export function claimCheckin(token: string) {
  return authFetch<CheckinClaim>('/fun/checkin/claim', token, { method: 'POST' })
}
