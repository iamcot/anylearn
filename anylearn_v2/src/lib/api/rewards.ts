import { authFetch } from './client'

export interface MyRewards {
  referral: { code: string; link: string; invited: number; pointsEarned: number }
  family: { enabled: boolean; percent: number; windowDays: number }
}

export async function getMyRewards(token: string): Promise<MyRewards | null> {
  const res = await authFetch<MyRewards>('/me/rewards', token)
  return res.data
}
