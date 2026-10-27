import { apiFetch, authFetch } from './client'

export type RecommendationSource = 'pathway' | 'sibling' | 'free_slot' | 'season' | 'interest'
export type RecommendationContext = 'today' | 'order_success'

export interface Recommendation {
  itemId: number
  title: string
  image: string | null
  price: number | null
  seoUrl: string | null
  learnerId: number
  learnerName: string
  source: RecommendationSource
  reasonCode: string
  reasonText: string
}

type Result<T> = Promise<{ data: T | null; error?: string }>

function post<T>(path: string, token: string, body: object): Result<T> {
  return authFetch<T>(path, token, { method: 'POST', body: JSON.stringify(body) })
}

/** The one suggestion card of /today for a learner. */
export function getTodayRecommendations(learnerId: number, token: string): Result<Recommendation[]> {
  return authFetch<Recommendation[]>(`/recommendations?context=today&learnerId=${learnerId}`, token)
}

/** Suggestions for the other children after an order. */
export function getOrderRecommendations(orderId: string | number, token: string): Result<Recommendation[]> {
  return authFetch<Recommendation[]>(`/recommendations?context=order_success&orderId=${orderId}`, token)
}

export function recordRecommendation(rec: Recommendation, context: RecommendationContext, event: 'view' | 'click', token: string): Result<unknown> {
  return post('/recommendations/events', token, { learnerId: rec.learnerId, itemId: rec.itemId, source: rec.source, context, event })
}

/** "Không quan tâm": hidden for this learner for the number of days set in the back office. */
export function dismissRecommendation(rec: Recommendation, token: string): Result<{ hiddenUntil: string }> {
  return post('/recommendations/dismiss', token, { learnerId: rec.learnerId, itemId: rec.itemId })
}

export interface PathwayStep { stepNo: number; itemId: number; note: string | null; title: string; image: string | null; price: number | null; seoUrl: string | null; done: boolean }
export interface Pathway { id: number; slug: string; title: string; subtitle: string | null; steps: PathwayStep[]; stepNo?: number }

/** The pathways a course is part of (public); empty when it is in none. */
export async function getItemPathways(itemId: number): Promise<Pathway[]> {
  const data = await apiFetch<Pathway[]>(`/items/${itemId}/pathway`, { cache: 'no-store' })
  return Array.isArray(data) ? data : []
}
