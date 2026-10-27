import { API_BASE } from '@/lib/apiBase'
import { authFetch } from './client'
import type { Recommendation } from './recommendations'

export interface AiSuggestResult {
  // null when the rules answered instead of the AI (nothing is saved, so there is nothing to rate)
  suggestionId: number | null
  ai: boolean
  learnerName: string
  items: Recommendation[]
  feedback?: { rating: number } | null
}

type Result<T> = Promise<{ data: T | null; error?: string }>

/** Today's suggestions for a learner; the first call of the day asks the AI, later calls read the saved answer. */
export function runAiSuggest(learnerId: number, token: string): Result<AiSuggestResult> {
  return authFetch<AiSuggestResult>('/ai-suggestions', token, { method: 'POST', body: JSON.stringify({ learnerId }) })
}

export function sendAiFeedback(suggestionId: number, feedback: { rating: 1 | -1; reasons: string[]; comment: string }, token: string): Result<unknown> {
  return authFetch(`/ai-suggestions/${suggestionId}/feedback`, token, { method: 'POST', body: JSON.stringify(feedback) })
}

let statusPromise: Promise<boolean> | null = null

/** Whether the back office has the AI on; asked once per page load. A failed call counts as off. */
export function isAiSuggestEnabled(): Promise<boolean> {
  if (!statusPromise) {
    statusPromise = fetch(`${API_BASE}/ai-suggestions/status`)
      .then(res => res.json())
      .then(json => Boolean(json?.data?.enabled))
      .catch(() => false)
  }
  return statusPromise
}
