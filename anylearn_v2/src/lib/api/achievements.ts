import { API_BASE } from '@/lib/apiBase'
import { authFetch } from './client'

export interface Achievement {
  token: string
  type: 'rankup' | 'streak' | 'board' | 'sticker_set'
  title: string
  subtitle: string
  icon: string
  createdAt?: string
  shares?: number
}

export interface PublicAchievement extends Achievement {
  name: string
  refCode: string
  game: string
}

/** Public view of a banner for the share page. Never throws: null means "not found". */
export async function getPublicAchievement(token: string): Promise<PublicAchievement | null> {
  try {
    const res = await fetch(`${API_BASE}/achievements/${encodeURIComponent(token)}`, { next: { revalidate: 60 } })
    const json = await res.json()
    if (!res.ok || json?.resultCode !== 1 || !json.data) return null
    return json.data as PublicAchievement
  } catch {
    return null
  }
}

export function getMyAchievements(token: string) {
  return authFetch<Achievement[]>('/achievements?limit=20', token)
}

export function countAchievementOpen(token: string) {
  return fetch(`${API_BASE}/achievements/${encodeURIComponent(token)}/open`, { method: 'POST' }).catch(() => null)
}

export function countAchievementShare(authToken: string, token: string) {
  return authFetch<{ counted: boolean }>(`/achievements/${encodeURIComponent(token)}/share`, authToken, { method: 'POST' })
}
