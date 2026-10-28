import { authFetch } from './client'

export interface CheckinDay { day: number; points: number; state: 'done' | 'today' | 'todo' }

export interface CheckinStatus {
  enabled: boolean
  today: string
  claimedToday: boolean
  streak: number
  best: number
  dayInCycle: number
  nextPoints: number | null
  days: CheckinDay[]
}

export interface CheckinClaim {
  alreadyClaimed: boolean
  points: number
  capped?: boolean
  streak?: number
  dayInCycle?: number
}

export function getCheckin(token: string) {
  return authFetch<CheckinStatus>('/fun/checkin', token)
}

export function claimCheckin(token: string) {
  return authFetch<CheckinClaim>('/fun/checkin/claim', token, { method: 'POST' })
}
