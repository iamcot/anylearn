import { apiFetch, authFetch } from './client'

export type RecommendationSource = 'pathway' | 'sibling' | 'free_slot' | 'season' | 'interest' | 'ai'
export type RecommendationContext = 'today' | 'order_success' | 'ai_suggest'

export interface Recommendation {
  itemId: number
  title: string
  image: string | null
  price: number | null
  seoUrl: string | null
  learnerId: number
  learnerName: string
  source: RecommendationSource
  /** The pathway page to open, only for pathway suggestions. */
  pathwaySlug?: string | null
  pathwayProgress?: { stepNo: number; done: boolean; skipped: boolean; next: boolean }[]
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

export interface PathwayCourse { itemId: number; title: string; image: string | null; price: number | null; seoUrl: string | null; owned: boolean; related: boolean }
/** A step holds one or more courses the learner can choose from. */
export interface PathwayStep {
  stepNo: number
  note: string | null
  items: PathwayCourse[]
  done: boolean
  skipped: boolean
  restarted: boolean
  next: boolean
}
export interface Pathway { id: number; slug: string; title: string; subtitle: string | null; steps: PathwayStep[]; stepNo?: number; doneSteps?: number; totalSteps?: number }

/** The pathways a course is part of (public); empty when it is in none. */
export async function getItemPathways(itemId: number): Promise<Pathway[]> {
  const data = await apiFetch<Pathway[]>(`/items/${itemId}/pathway`, { cache: 'no-store' })
  return Array.isArray(data) ? data : []
}

/** One pathway with its steps; with a learner (and a token) each step says whether they already have it. */
export async function getPathway(slug: string, learnerId: number | null, token: string | null): Promise<Pathway | null> {
  const query = learnerId != null && token ? `?learnerId=${learnerId}` : ''
  if (token) return (await authFetch<Pathway>(`/pathways/${encodeURIComponent(slug)}${query}`, token)).data
  return apiFetch<Pathway>(`/pathways/${encodeURIComponent(slug)}`, { cache: 'no-store' })
}

/** "Đặt lại": go back to a step the learner skipped. */
export function restartPathwayStep(slug: string, learnerId: number, stepNo: number, token: string): Promise<{ data: unknown; error?: string }> {
  return authFetch(`/pathways/${encodeURIComponent(slug)}/restart`, token, { method: 'POST', body: JSON.stringify({ learnerId, stepNo }) })
}
