import { API_BASE } from '@/lib/apiBase'
import { authFetch } from './client'

export type ExploreKind = 'article' | 'image' | 'video'
export type ExploreStatus = 'draft' | 'pending' | 'published' | 'hidden' | 'rejected'
export interface ExploreTag { id: number; name: string }

export interface ExplorePost {
  id: number
  kind: ExploreKind
  title: string
  body: string | null
  mediaUrl: string | null
  posterUrl: string | null
  itemId: number | null
  itemTitle: string | null
  itemImage?: string | null
  itemPrice?: number | null
  views: number
  likes: number
  shares: number
  comments: number
  likedByMe: boolean
  publishedAt: string | null
  authorId?: number | null
  /** Last two words of a creator's name; null for a post of anyLEARN. */
  authorName?: string | null
  tags?: ExploreTag[]
  tagIds?: number[]
  // a creator's own posts
  status?: ExploreStatus
  approved?: boolean
  hiddenBy?: 'creator' | 'admin' | null
  reviewNote?: string | null
  afterUpload?: string | null
}

export interface ExploreFeed { enabled: boolean; commentsEnabled: boolean; items: ExplorePost[]; total: number; page: number }
export interface ExploreComment { id: number; name: string; body: string; createdAt: string; mine: boolean }

export function getExploreFeed(token: string, page: number, size = 10, since?: number, exclude: number[] = []) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (since) params.set('since', String(since))
  for (const id of exclude) params.append('exclude', String(id))
  return authFetch<ExploreFeed>(`/explore?${params.toString()}`, token)
}
export const searchExplore = (token: string, q: string, page: number, size = 12) =>
  authFetch<ExploreFeed>(`/explore/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`, token)
export const getExplorePost = (token: string, id: number) => authFetch<ExplorePost>(`/explore/${id}`, token)
export const countExploreView = (token: string, id: number) => authFetch<{ ok: boolean }>(`/explore/${id}/view`, token, { method: 'POST' })
export const countExploreShare = (token: string, id: number) => authFetch<{ ok: boolean }>(`/explore/${id}/share`, token, { method: 'POST' })
export const toggleExploreLike = (token: string, id: number) => authFetch<{ liked: boolean; likes: number }>(`/explore/${id}/like`, token, { method: 'POST' })
export const getExploreComments = (token: string, id: number, before = 0) => authFetch<ExploreComment[]>(`/explore/${id}/comments?before=${before}&size=20`, token)
export const addExploreComment = (token: string, id: number, body: string) =>
  authFetch<{ id: number; comments: number }>(`/explore/${id}/comments`, token, { method: 'POST', body: JSON.stringify({ body }) })
export const deleteExploreComment = (token: string, commentId: number) => authFetch<{ ok: boolean }>(`/explore/comments/${commentId}`, token, { method: 'DELETE' })
export const reportExploreComment = (token: string, commentId: number, reason: string) =>
  authFetch<{ ok: boolean }>(`/explore/comments/${commentId}/report`, token, { method: 'POST', body: JSON.stringify({ reason }) })

// ---- creators (plan 16) ----

export type CreatorLevel = 'creator' | 's_creator'
export interface CreatorMe { level: CreatorLevel | null; videoUpload: boolean }
export interface CreatorPage { items: ExplorePost[]; total: number; page: number }
export interface CreatorDraft {
  kind: ExploreKind
  title: string
  body: string
  mediaUrl: string
  posterUrl: string
  itemId: number | null
  tagIds: number[]
  /** A clip is on its way to Bunny: the post waits until it is attached. */
  uploading?: boolean
}
export interface CourseHit { id: number; title: string; image?: string | null; price?: number | null }
export interface BunnyUpload { endpoint: string; videoId: string; libraryId: string; authorizationSignature: string; authorizationExpire: number; mediaUrl: string; posterUrl: string }

const C = '/explore/creator'
export const getCreatorMe = (token: string) => authFetch<CreatorMe>(`${C}/me`, token)
export const getMyPosts = (token: string, page: number, size = 12) => authFetch<CreatorPage>(`${C}/posts?page=${page}&size=${size}`, token)
export const getMyPost = (token: string, id: number) => authFetch<ExplorePost>(`${C}/posts/${id}`, token)
export const saveMyPost = (token: string, id: number | null, draft: CreatorDraft) =>
  authFetch<{ id: number; status: ExploreStatus }>(id ? `${C}/posts/${id}` : `${C}/posts`, token, { method: id ? 'PUT' : 'POST', body: JSON.stringify(draft) })
export const attachMyMedia = (token: string, id: number, mediaUrl: string, posterUrl: string) =>
  authFetch<{ ok: boolean }>(`${C}/posts/${id}/media`, token, { method: 'PUT', body: JSON.stringify({ mediaUrl, posterUrl }) })
export const hideMyPost = (token: string, id: number) => authFetch<{ status: ExploreStatus }>(`${C}/posts/${id}/hide`, token, { method: 'POST' })
export const showMyPost = (token: string, id: number) => authFetch<{ status: ExploreStatus }>(`${C}/posts/${id}/show`, token, { method: 'POST' })
export const deleteMyPost = (token: string, id: number) => authFetch<{ ok: boolean }>(`${C}/posts/${id}`, token, { method: 'DELETE' })
export const searchCreatorTags = (token: string, q: string) => authFetch<ExploreTag[]>(`${C}/tags?q=${encodeURIComponent(q)}`, token)
export const searchCreatorCourses = (token: string, q: string) => authFetch<{ items: CourseHit[] }>(`${C}/courses?q=${encodeURIComponent(q)}`, token)
export const createVideoUpload = (token: string, title: string) =>
  authFetch<BunnyUpload>(`${C}/video-upload`, token, { method: 'POST', body: JSON.stringify({ title }) })

/** Uploads a photo (multipart, so not through authFetch which sends JSON). */
export async function uploadCreatorImage(token: string, file: File): Promise<{ data: string | null; error?: string }> {
  const form = new FormData()
  form.append('image', file)
  try {
    const res = await fetch(`${API_BASE}${C}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
    const json = await res.json()
    if (!res.ok || json?.resultCode === 0) return { data: null, error: json?.message || 'Tải hình thất bại' }
    return { data: json?.data?.url ?? null }
  } catch {
    return { data: null, error: 'Không thể kết nối máy chủ' }
  }
}
