import { authFetch, apiFetch } from './client'
import { API_BASE } from '@/lib/apiBase'

// Plan 21: Hành trình anyLEARN, anyLEARN Foundation, learner tier, guest quiz.

// ── journey ───────────────────────────────────────────────────────────

export interface JourneyMission {
  key: string
  label: string
  hint: string
  route: string
  coins: number
  sticker: boolean
  optional: boolean
  done: boolean
  claimed: boolean
}

export interface JourneyChapter {
  no: number
  title: string
  gift: string
  coins: number
  open: boolean
  complete: boolean
  claimed: boolean
  required: number
  requiredDone: number
  missions: JourneyMission[]
}

export interface JourneyNext { key: string; chapter: number; label: string; hint: string; route: string; coins: number }

export interface Journey {
  enabled: boolean
  signedIn: boolean
  coinName: string
  hasOrder: boolean
  ready: number
  chapters: JourneyChapter[]
  next: JourneyNext | null
}

/** One thing paid now, played by Leo's coin animation. */
export interface Reward {
  kind: 'mission' | 'chapter' | 'order' | 'quiz'
  key: string
  label: string
  coins?: number
  points?: number
  sticker?: { name?: string; emoji?: string; imageUrl?: string | null } | null
  foundation?: number
  foundationLabel?: string
  achievement?: string | null
  vouchers?: number
  chapter?: number
  /** Extra gift lines shown as they are (for example the farm's XP and fertilizer). */
  extra?: string[]
}

export async function getJourney(token: string | null): Promise<Journey | null> {
  if (!token) return apiFetch<Journey>('/journey', { cache: 'no-store' })
  const { data } = await authFetch<Journey>('/journey', token)
  return data
}

export async function claimJourney(token: string): Promise<{ coinName: string; rewards: Reward[] }> {
  const { data } = await authFetch<{ coinName: string; rewards: Reward[] }>('/journey/claim', token, { method: 'POST' })
  return data ?? { coinName: 'Leo Xu', rewards: [] }
}

export type JourneyEvent = 'pwa_install' | 'near' | 'compare'

export async function sendJourneyEvent(token: string, type: JourneyEvent): Promise<void> {
  await authFetch('/journey/event', token, { method: 'POST', body: JSON.stringify({ type }) })
}

// ── foundation ────────────────────────────────────────────────────────

export interface FoundationContribution { id: number; name: string; label: string; source: string; houseNo: number; at: string }

export interface FoundationHouse { houseNo: number; completedAt: string; school?: string | null; place?: string | null; openedOn?: string | null; photoUrl?: string | null; proofUrl?: string | null; note?: string | null }

export interface FoundationState {
  enabled: boolean
  houseValue: number
  housesBuilt: number
  currentHouse: number
  currentAmount: number
  percent: number
  remaining: number
  totalAmount: number
  contributors: number
  recent: FoundationContribution[]
  houses: FoundationHouse[]
}

export interface FoundationItem { amount: number; label: string | null }

export interface FoundationMine { total: number; times: number; bricks: number; houses: number[]; hideName: boolean }

/** What a paid order gave the fund (in `GET /order/{id}`). */
export interface FoundationOfOrder { amount: number; label: string; houseNo: number; housesBuilt: number; percent: number }

export async function getFoundation(): Promise<FoundationState | null> {
  return apiFetch<FoundationState>('/foundation', { next: { revalidate: 60 } })
}

export async function getFoundationForItem(itemId: number | string): Promise<FoundationItem | null> {
  return apiFetch<FoundationItem>(`/foundation/item/${itemId}`, { next: { revalidate: 300 } })
}

export async function getMyFoundation(token: string): Promise<FoundationMine | null> {
  const { data } = await authFetch<FoundationMine>('/foundation/me', token)
  return data
}

export async function setFoundationHideName(token: string, hide: boolean): Promise<string | undefined> {
  const { error } = await authFetch('/foundation/hide-name', token, { method: 'POST', body: JSON.stringify({ hide }) })
  return error
}

// ── learner tier ──────────────────────────────────────────────────────

export interface TierStep { key: string; label: string; icon: string; min: number }

export interface FinishedCourse { id: number; itemId: number; title: string; image?: string | null; source: string; completedAt: string }

export interface MarkableCourse { enrollmentId: number; itemId: number; title: string }

export interface LearnerTier {
  learnerId: number
  name: string
  finished: number
  tier: string
  label: string
  icon: string
  level: number
  toNext: number
  nextLabel: string | null
  courses: FinishedCourse[]
  canMark: MarkableCourse[]
}

export interface LearnerTierSummary { enabled: boolean; tiers: TierStep[]; learners: LearnerTier[] }

export async function getLearnerTiers(token: string): Promise<LearnerTierSummary | null> {
  const { data } = await authFetch<LearnerTierSummary>('/me/learner-tier', token)
  return data
}

export async function markCourseFinished(token: string, enrollmentId: number): Promise<string | undefined> {
  const { error } = await authFetch('/me/learner-tier/complete', token, { method: 'POST', body: JSON.stringify({ enrollmentId }) })
  return error
}

// ── guest quiz ────────────────────────────────────────────────────────

export interface GuestQuestion { id: number; body: string; options: string[] }

export interface GuestQuiz { enabled: boolean; coinName: string; signupCoins: number; questions: GuestQuestion[] }

export interface GuestAnswer { correct: boolean; correctOption: number; explanation?: string | null }

export async function getGuestQuiz(): Promise<GuestQuiz | null> {
  return apiFetch<GuestQuiz>('/guest-quiz', { cache: 'no-store' })
}

export async function answerGuestQuiz(questionId: number, option: number): Promise<GuestAnswer | null> {
  try {
    const res = await fetch(`${API_BASE}/guest-quiz/answer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId, option }),
    })
    const json = await res.json()
    return json?.resultCode === 1 ? json.data : null
  } catch {
    return null
  }
}
