import { authFetch } from './client'

export interface ExplorePost {
  id: number
  kind: 'article' | 'image' | 'video'
  title: string
  body: string | null
  mediaUrl: string | null
  posterUrl: string | null
  itemId: number | null
  itemTitle: string | null
  views: number
  likes: number
  shares: number
  comments: number
  likedByMe: boolean
  publishedAt: string | null
}

export interface ExploreFeed { enabled: boolean; commentsEnabled: boolean; items: ExplorePost[]; total: number; page: number }
export interface ExploreComment { id: number; name: string; body: string; createdAt: string; mine: boolean }

export const getExploreFeed = (token: string, page: number, size = 10) => authFetch<ExploreFeed>(`/explore?page=${page}&size=${size}`, token)
export const countExploreView = (token: string, id: number) => authFetch<{ ok: boolean }>(`/explore/${id}/view`, token, { method: 'POST' })
export const countExploreShare = (token: string, id: number) => authFetch<{ ok: boolean }>(`/explore/${id}/share`, token, { method: 'POST' })
export const toggleExploreLike = (token: string, id: number) => authFetch<{ liked: boolean; likes: number }>(`/explore/${id}/like`, token, { method: 'POST' })
export const getExploreComments = (token: string, id: number, before = 0) => authFetch<ExploreComment[]>(`/explore/${id}/comments?before=${before}&size=20`, token)
export const addExploreComment = (token: string, id: number, body: string) =>
  authFetch<{ id: number; comments: number }>(`/explore/${id}/comments`, token, { method: 'POST', body: JSON.stringify({ body }) })
export const deleteExploreComment = (token: string, commentId: number) => authFetch<{ ok: boolean }>(`/explore/comments/${commentId}`, token, { method: 'DELETE' })
export const reportExploreComment = (token: string, commentId: number, reason: string) =>
  authFetch<{ ok: boolean }>(`/explore/comments/${commentId}/report`, token, { method: 'POST', body: JSON.stringify({ reason }) })
