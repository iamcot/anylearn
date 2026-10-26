import { apiFetch, authFetch } from './client'
import { API_BASE } from '@/lib/apiBase'
import type { PdpReview } from './catalog'

export interface ReviewSummary {
  count: number
  average: number | null
  // "5" .. "1" -> number of reviews
  distribution: Record<string, number>
  criteria: Record<string, number>
  photos: string[]
}

export async function getReviewSummary(itemId: number): Promise<ReviewSummary | null> {
  return apiFetch<ReviewSummary>(`/item/${itemId}/review-summary`)
}

export async function getReviews(itemId: number, filters: { stars?: number; photos?: boolean } = {}): Promise<PdpReview[]> {
  const query = new URLSearchParams()
  if (filters.stars) query.set('stars', String(filters.stars))
  if (filters.photos) query.set('photos', 'true')
  const suffix = query.toString() ? `?${query.toString()}` : ''
  // Reviews change when someone writes or hides one: no cache.
  return (await apiFetch<PdpReview[]>(`/item/${itemId}/reviews${suffix}`, { next: { revalidate: 0 } })) ?? []
}

export interface SaveReviewInput {
  rating: number
  comment: string
  scores: Record<string, number>
  media: string[]
}

export interface SaveReviewResult {
  error?: string
  // anyPoint given by this save (0 when none)
  pointsGiven: number
}

export async function saveReview(itemId: number, input: SaveReviewInput, token: string): Promise<SaveReviewResult> {
  const { data, error } = await authFetch<{ pointsGiven?: number }>(`/item/${itemId}/save-rating`, token, { method: 'POST', body: JSON.stringify(input) })
  return { error, pointsGiven: data?.pointsGiven ?? 0 }
}

export interface ReviewRewards {
  textPoints: number
  mediaPoints: number
  minTextLength: number
}

export async function getReviewRewards(): Promise<ReviewRewards | null> {
  return apiFetch<ReviewRewards>('/review-rewards')
}

// Uploads one photo for a review and returns its address.
export async function uploadReviewPhoto(itemId: number, file: File, token: string): Promise<{ url?: string; error?: string }> {
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await fetch(`${API_BASE}/item/${itemId}/review-media`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
    const json = await res.json()
    if (json?.resultCode === 1 && json.data?.url) return { url: json.data.url }
    return { error: json?.message ?? 'Không tải được ảnh' }
  } catch {
    return { error: 'Không tải được ảnh' }
  }
}

export async function replyToReview(itemId: number, reviewId: number, text: string, token: string): Promise<string | null> {
  const { error } = await authFetch(`/item/${itemId}/reviews/${reviewId}/reply`, token, { method: 'POST', body: JSON.stringify({ text }) })
  return error ?? null
}

export async function deleteReviewReply(itemId: number, reviewId: number, token: string): Promise<string | null> {
  const { error } = await authFetch(`/item/${itemId}/reviews/${reviewId}/reply`, token, { method: 'DELETE' })
  return error ?? null
}

export interface PartnerReviews extends ReviewSummary {
  latest: PdpReview[]
}

export async function getPartnerReviews(partnerId: number): Promise<PartnerReviews | null> {
  return apiFetch<PartnerReviews>(`/partners/${partnerId}/reviews`)
}
