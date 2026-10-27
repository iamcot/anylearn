import { authFetch } from './client'

export interface TierRow { key: string; label: string; minSpent: number; multiplier: number }

export interface MyTier {
  applies: boolean
  tier: string
  label: string
  spent12m: number
  /** anyPoint of every purchase is multiplied by this (1 = no extra). */
  multiplier: number
  next: string | null
  nextLabel: string | null
  /** Money still to spend in the 12 month window to reach the next tier. */
  remaining: number
  tiers: TierRow[]
}

export async function getMyTier(token: string): Promise<MyTier | null> {
  const res = await authFetch<MyTier>('/me/tier', token)
  return res.data
}
