import { cache } from 'react'
import { API_BASE } from '@/lib/apiBase'
import { Article } from './articles'
import { ItemSchedule } from './cart'
import { apiFetch } from './client'
import { trackingQuery, type SearchTracking } from '@/lib/search/searchTracking'

export interface Item {
  id: number
  title: string
  type: string
  subtype?: string
  shortContent?: string
  image?: string
  price: number
  dateStart?: string
  isHot?: number
  authorName?: string
  authorImage?: string
  authorId?: number
  authorRole?: string
  categoryTitles?: string
  seoUrl?: string
  rating?: number
  num_favorite?: number
  // anyPoint the buyer earns (plan 02.2); shown on cards unless NEXT_PUBLIC_CARD_POINTS=0
  points?: number
  // Search results only (plan 04.2)
  distanceKm?: number
  hasFreeTrial?: boolean
  onSale?: boolean
  timeSlots?: string[]
  pricePerSession?: number
}

export interface UserResult {
  id: number
  name: string
  role: string
  title?: string
  introduce?: string
  image?: string
  banner?: string
  isHot?: number
  boostScore?: number
  rating?: number
}

export interface UserSearchResult {
  items: UserResult[]
  total: number
  page: number
  pageSize: number
}

export interface Category {
  id: number
  title: string
  url: string
  items?: Item[]
}

export interface HomeData {
  new_banners: unknown[]
  articles: Article[]
  configs: Record<string, unknown>
  home_classes: { title: string; classes: Item[] }[]
  promotions: Article[]
  events: Article[]
  categories: Category[]
}

export async function getCategories(): Promise<Category[]> {
  const result = await apiFetch<Category[]>('/config/category')
  return result ?? []
}

export interface PublicUserProfile {
  id: number
  name: string
  role: string
  title?: string
  image?: string
  banner?: string
  introduce?: string
  full_content?: string
}

export async function getUserProfile(userId: number): Promise<PublicUserProfile | null> {
  return apiFetch<PublicUserProfile>(`/user/profile/${userId}`)
}

export interface PdpItem {
  id: number
  title: string
  type: string
  subtype?: string
  image?: string
  shortContent?: string
  content?: string
  price: number
  orgPrice?: number
  dateStart?: string
  dateEnd?: string
  timeStart?: string
  timeEnd?: string
  locationType?: string
  location?: string
  agesMin?: number
  agesMax?: number
  seats?: number
  seoUrl?: string
  seoTitle?: string
  seoDesc?: string
  nolimitTime?: string
  cycleType?: string
  cycleAmount?: number
  isHot?: number
  userId?: number
  allowReRegister?: number
  activiyTrial?: number
  activiyTest?: number
  activiyVisit?: number
}

export interface PdpAuthor {
  id: number
  name: string
  role: string
  image?: string
  introduce?: string
  isHot?: number
}

export interface PdpReview {
  id?: number
  user_id: number
  user_name: string
  user_image?: string
  value: string
  extra_value?: string
  created_at: string
  // Reviews plan 09
  is_verified?: boolean
  scores?: Record<string, number>
  media?: string[]
  partner_reply?: string | null
  partner_replied_at?: string | null
  item_title?: string
  item_id?: number
}

export interface PdpCategory {
  id: number
  title: string
  url: string
}

export interface PdpData {
  item: PdpItem
  author?: PdpAuthor
  categories: PdpCategory[]
  reviews: PdpReview[]
  rating?: number
  num_favorite: number
  num_cart: number
  authorItems: Item[]
  hotItems: Item[]
  plans: {
    location: { location_id: number; location_title: string; address: string }
    plans: unknown[]
  }[]
  num_schedule: number
  is_fav: boolean
  has_purchased: boolean
  schedules?: ItemSchedule[]
  enrolled_count?: number
}

export const getPdpData = cache(getPdpDataUncached)

async function getPdpDataUncached(id: number): Promise<PdpData | null> {
  // no-store: PDP has personalized data (is_fav, has_purchased) and engagement counts
  // that must be fresh on every load. ISR would show stale fav counts and ratings.
  try {
    const res = await fetch(`${API_BASE}/pdp/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? json
  } catch {
    return null
  }
}

export function getCourseUrl(item: { id: number; seoUrl?: string; title?: string }): string {
  const slug = item.seoUrl || (item.title ?? '').toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `/class/${item.id}/${slug}`
}

export async function getHomeV2(): Promise<HomeData | null> {
  return apiFetch<HomeData>('/config/homev2/buyer')
}

export interface SearchResult {
  items: Item[]
  total: number
  page: number
  pageSize: number
}

// Only the first page of a search is logged by the server; the ref lets a later click name its search.
function withTracking(path: string, page: number, tracking?: SearchTracking): [string, RequestInit?] {
  if (!tracking || page > 0) return [path]
  const options: RequestInit | undefined = tracking.token ? { headers: { Authorization: `Bearer ${tracking.token}` } } : undefined
  return [path + trackingQuery(tracking), options]
}

export interface SearchItemsOptions {
  category?: string
  sort?: string
  authorId?: number
  age?: string
  priceRange?: string
  location?: string
  mode?: string
  // Extra query parameters (advancedApiParams), repeated keys allowed
  extra?: [string, string][]
}

export async function searchItems(q: string, page = 0, pageSize = 20, options: SearchItemsOptions = {}, tracking?: SearchTracking): Promise<SearchResult> {
  const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) })
  const optional: [string, string | number | undefined][] = [
    ['category', options.category], ['sort', options.sort], ['authorId', options.authorId], ['age', options.age],
    ['priceRange', options.priceRange], ['location', options.location], ['mode', options.mode],
  ]
  for (const [key, value] of optional) if (value) params.set(key, String(value))
  for (const [key, value] of options.extra ?? []) params.append(key, value)
  const result = await apiFetch<SearchResult>(...withTracking(`/search?${params.toString()}`, page, tracking))
  return result ?? { items: [], total: 0, page, pageSize }
}

export interface TopRatedResult {
  title: string
  days: number
  items: Item[]
}

// Courses with the best reviews of the last `days` days (the back office sets the period; the title follows it).
export async function getTopRated(limit = 24): Promise<TopRatedResult | null> {
  return apiFetch<TopRatedResult>(`/top-rated?limit=${limit}`)
}

export interface SearchOptions {
  districts: { code: string; name: string }[]
  tags: { id: number; name: string; group: string }[]
  // How far "Gần tôi" reaches, set in the back office
  nearRadiusKm?: number
}

export async function getSearchOptions(province?: string): Promise<SearchOptions> {
  const result = await apiFetch<SearchOptions>(province ? `/search/options?province=${encodeURIComponent(province)}` : '/search/options')
  return result ?? { districts: [], tags: [] }
}

export async function searchTags(q?: string): Promise<string[]> {
  const path = q ? `/search-tags?q=${encodeURIComponent(q)}` : '/search-tags'
  const result = await apiFetch<string[]>(path)
  return result ?? []
}

export async function searchUsers(q: string, role: string, page = 0, pageSize = 20, sort?: string, authorId?: number, tracking?: SearchTracking): Promise<UserSearchResult> {
  let path = `/search/users?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}&page=${page}&pageSize=${pageSize}`
  if (sort) path += `&sort=${encodeURIComponent(sort)}`
  if (authorId) path += `&authorId=${authorId}`
  const result = await apiFetch<UserSearchResult>(...withTracking(path, page, tracking))
  return result ?? { items: [], total: 0, page, pageSize }
}
