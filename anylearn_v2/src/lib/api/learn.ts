import { authFetch } from './client'
import { API_BASE } from '@/lib/apiBase'
import type { Recommendation } from './recommendations'

// Video courses (plan 17): outline, playing a lesson, progress, my courses, study plans and the suggestions after a course.

export interface OutlineLesson {
  id: number
  title: string
  type: 'video' | 'link' | 'text'
  durationSeconds: number | null
  free: boolean
  playable: boolean
  locked: boolean
  completed: boolean
  positionSeconds: number
}

export interface OutlineChapter {
  id: number
  title: string
  description: string | null
  lessons: OutlineLesson[]
}

export interface LearnerRef { id: number; name: string; self: boolean }

export interface CourseProgress {
  doneLessons: number
  countedLessons: number
  percent: number
  resumeLessonId: number | null
  resumeTitle: string | null
  resumeNo: number | null
  started: boolean
  lastStudiedAt: string | null
}

export interface VideoOutline extends Partial<CourseProgress> {
  itemId: number
  title?: string
  seoUrl?: string | null
  image?: string | null
  price?: number | null
  chapters: OutlineChapter[]
  totalChapters: number
  totalLessons: number
  freeLessons: number
  durationSeconds: number
  durationText: string
  access: boolean
  learnerId?: number
  learnerName?: string
  learners?: LearnerRef[]
}

export interface PlayInfo {
  id: number
  itemId: number
  title: string
  description: string | null
  type: 'video' | 'link' | 'text'
  free: boolean
  durationSeconds: number | null
  attachments: { name: string; url: string }[]
  url: string | null
  text?: string | null
  posterUrl: string | null
  no: number
  prevLessonId: number | null
  nextLessonId: number | null
  nextTitle: string | null
  nextLocked: boolean
  access: boolean
  learnerId?: number
  positionSeconds: number
  completed: boolean
}

export interface ProgressResult { completed: boolean; percent: number; milestone: number }

export interface StudyPlan {
  id?: number
  weekdays: number[]
  time: string | null
  lessonsPerSession: number
  enabled: boolean
  text?: string
}

export interface MyVideoCourse extends CourseProgress {
  learnerId: number
  learnerName: string
  self: boolean
  itemId: number
  title: string
  image: string | null
  seoUrl: string | null
  totalLessons: number
  plan: StudyPlan | null
}

type Result<T> = Promise<{ data: T | null; error?: string }>

/** Public fetch that still sends the token when there is one (free lessons play for visitors too). */
async function maybeAuth<T>(path: string, token: string | null, options?: RequestInit): Result<T> {
  if (token) return authFetch<T>(path, token, options)
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store', ...options })
    const json = await res.json()
    if (!res.ok || json?.resultCode === 0) return { data: null, error: json?.message || 'Lỗi không xác định' }
    return { data: json?.data ?? json }
  } catch {
    return { data: null, error: 'Không thể kết nối máy chủ' }
  }
}

export function getVideoOutline(itemId: number, token: string | null, learnerId?: number | null): Result<VideoOutline> {
  return maybeAuth<VideoOutline>(`/items/${itemId}/video-outline${learnerId ? `?learnerId=${learnerId}` : ''}`, token)
}

export function playLesson(lessonId: number, token: string | null, learnerId?: number | null): Result<PlayInfo> {
  return maybeAuth<PlayInfo>(`/learn/lessons/${lessonId}/play${learnerId ? `?learnerId=${learnerId}` : ''}`, token)
}

export function saveProgress(token: string, body: { lessonId: number; learnerId?: number | null; positionSeconds: number; watchedDelta: number; done?: boolean }, keepalive = false): Result<ProgressResult> {
  return authFetch<ProgressResult>('/learn/progress', token, { method: 'POST', body: JSON.stringify(body), keepalive })
}

export function getMyVideoCourses(token: string, learnerId?: number | null): Result<MyVideoCourse[]> {
  return authFetch<MyVideoCourse[]>(`/learn/my-courses${learnerId ? `?learnerId=${learnerId}` : ''}`, token)
}

export function getVideoToday(token: string, learnerId?: number | null): Result<{ continue: MyVideoCourse[]; sessions: MyVideoCourse[] }> {
  return authFetch(`/learn/today${learnerId ? `?learnerId=${learnerId}` : ''}`, token)
}

export function getStudyPlan(token: string, learnerId: number, itemId: number): Result<StudyPlan | Record<string, never>> {
  return authFetch(`/learn/plan?learnerId=${learnerId}&itemId=${itemId}`, token)
}

export function saveStudyPlan(token: string, body: StudyPlan & { learnerId: number; itemId: number }): Result<StudyPlan> {
  return authFetch<StudyPlan>('/learn/plan', token, { method: 'PUT', body: JSON.stringify(body) })
}

export function deleteStudyPlan(token: string, learnerId: number, itemId: number): Result<unknown> {
  return authFetch(`/learn/plan?learnerId=${learnerId}&itemId=${itemId}`, token, { method: 'DELETE' })
}

export function getVideoSuggestions(token: string, itemId: number, learnerId: number, limit = 3): Result<Recommendation[]> {
  return authFetch<Recommendation[]>(`/learn/suggestions?itemId=${itemId}&learnerId=${learnerId}&limit=${limit}`, token)
}
