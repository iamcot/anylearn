import { apiFetch, authFetch } from './client'
import type { MyPointExpiry, PointExpiryPolicy } from '@/lib/points/expiry'

/** The rule in words: public, for the explanation page. */
export function getPointExpiryPolicy(): Promise<PointExpiryPolicy | null> {
  return apiFetch<PointExpiryPolicy>('/points/expiry-policy', { cache: 'no-store' })
}

/** The rule and the signed-in member's own schedule. */
export async function getMyPointExpiry(token: string): Promise<MyPointExpiry | null> {
  const res = await authFetch<MyPointExpiry>('/points/expiry', token)
  return res.data
}
