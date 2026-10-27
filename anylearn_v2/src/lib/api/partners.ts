import { apiFetch, authFetch } from './client'
import type { Item } from './catalog'

export interface PartnerLocation {
  id: number
  title?: string | null
  address?: string | null
  districtName?: string | null
  provinceName?: string | null
  lat?: number | null
  lng?: number | null
  isHead: boolean
}

export interface PartnerSummary {
  partnerType?: string | null
  courseCount: number
  followerCount: number
  following: boolean
  locations: PartnerLocation[]
}

export async function getPartnerSummary(partnerId: number): Promise<PartnerSummary | null> {
  return apiFetch<PartnerSummary>(`/partners/${partnerId}/summary`)
}

// With the token the answer also says whether this member already follows the partner.
export async function getMyPartnerSummary(partnerId: number, token: string): Promise<PartnerSummary | null> {
  const { data } = await authFetch<PartnerSummary>(`/partners/${partnerId}/summary`, token)
  return data
}

export async function setFollowing(partnerId: number, follow: boolean, token: string): Promise<{ following: boolean; followerCount: number } | null> {
  const { data } = await authFetch<{ following: boolean; followerCount: number }>(`/partners/${partnerId}/follow`, token, { method: follow ? 'POST' : 'DELETE' })
  return data
}

export interface NearbyPartner {
  id: number
  name: string
  image?: string | null
  intro: string
  rating?: number | null
  ratingCount?: number
  lat: number
  lng: number
  distanceKm: number
}

// Schools with a branch in the circle around a point; without `radiusKm` the back office radius is used.
export async function getNearbyPartners(lat: number, lng: number, radiusKm?: number): Promise<{ radiusKm: number; partners: NearbyPartner[] } | null> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
  if (radiusKm !== undefined) params.set('radiusKm', String(radiusKm))
  return apiFetch<{ radiusKm: number; partners: NearbyPartner[] }>(`/partners/nearby?${params}`)
}

export interface DiscoverResult {
  items: Item[]
  total: number
  page: number
  pageSize: number
}

// Courses that fit the learner and the area in a random order that stays the same for the day.
export async function getDiscover(params: [string, string][], page: number, pageSize = 12): Promise<DiscoverResult> {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  params.forEach(([key, value]) => query.append(key, value))
  return (await apiFetch<DiscoverResult>(`/discover?${query.toString()}`)) ?? { items: [], total: 0, page, pageSize }
}
