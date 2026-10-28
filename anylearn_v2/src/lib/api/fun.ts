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
  coins?: number
  coinName?: string
}

export interface CoinHistoryRow { id: number; delta: number; balanceAfter: number; source: string; detail: string | null; createdAt: string }
export interface CoinWallet { coinName: string; balance: number; history: CoinHistoryRow[] }

export function getCoins(token: string) {
  return authFetch<CoinWallet>('/fun/coins', token)
}

export function getCheckin(token: string) {
  return authFetch<CheckinStatus>('/fun/checkin', token)
}

export function claimCheckin(token: string) {
  return authFetch<CheckinClaim>('/fun/checkin/claim', token, { method: 'POST' })
}
