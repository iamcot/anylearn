import { authFetch } from '@/lib/api'
import type { JoinData, LearnersData, MissedAttendance, RequestType, TodayData } from './types'

type Result<T> = Promise<{ data: T | null; error?: string }>

function post<T>(path: string, token: string, body: object): Result<T> {
  return authFetch<T>(path, token, { method: 'POST', body: JSON.stringify(body) })
}

export function getLearners(token: string): Result<LearnersData> {
  return authFetch<LearnersData>('/today/learners', token)
}

export function getToday(learnerId: number, token: string): Result<TodayData> {
  return authFetch<TodayData>(`/today?learnerId=${learnerId}`, token)
}

export function getMissedAttendance(learnerId: number, token: string, limit = 3): Result<MissedAttendance> {
  return authFetch<MissedAttendance>(`/today/missed-attendance?learnerId=${learnerId}&limit=${limit}`, token)
}

export function joinSession(learnerId: number, sessionKey: string, token: string): Result<JoinData> {
  return post<JoinData>('/today/join', token, { learnerId, sessionKey })
}

export function markAttended(learnerId: number, sessionKey: string, token: string): Result<unknown> {
  return post('/today/attendance', token, { learnerId, sessionKey })
}

export function requestChange(
  learnerId: number, sessionKey: string, type: RequestType, note: string, token: string,
): Result<{ id: number; status: string }> {
  return post('/today/requests', token, { learnerId, sessionKey, type, note })
}

export interface PendingSurvey {
  enrollmentId: number
  learnerId: number
  learnerName: string
  itemId: number
  itemTitle: string
}

export function getSurveys(token: string): Result<PendingSurvey[]> {
  return authFetch<PendingSurvey[]>('/lifecycle/surveys', token)
}

export function sendFeedback(enrollmentId: number, score: number, note: string, token: string): Result<{ saved: boolean; low: boolean }> {
  return post('/lifecycle/feedback', token, { enrollmentId, score, note })
}

/** Puts the renewal of this package in the cart (same class, same learner). */
export function renewEnrollment(enrollmentId: number, token: string): Result<{ early: boolean; bonusPoints: number }> {
  return post('/lifecycle/renew', token, { enrollmentId })
}
