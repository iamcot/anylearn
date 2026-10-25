import { API_BASE } from '@/lib/apiBase'
import { Article } from './articles'
import { ItemSchedule } from './cart'
import { apiFetch } from './client'

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
  user_id: number
  user_name: string
  user_image?: string
  value: string
  extra_value?: string
  created_at: string
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

export async function getPdpData(id: number): Promise<PdpData | null> {
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

export async function searchItems(q: string, page = 0, pageSize = 20, category?: string, sort?: string, authorId?: number, age?: string, priceRange?: string, location?: string, mode?: string): Promise<SearchResult> {
  let path = `/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`
  if (category) path += `&category=${encodeURIComponent(category)}`
  if (sort) path += `&sort=${encodeURIComponent(sort)}`
  if (authorId) path += `&authorId=${authorId}`
  if (age) path += `&age=${encodeURIComponent(age)}`
  if (priceRange) path += `&priceRange=${encodeURIComponent(priceRange)}`
  if (location) path += `&location=${encodeURIComponent(location)}`
  if (mode) path += `&mode=${encodeURIComponent(mode)}`
  const result = await apiFetch<SearchResult>(path)
  return result ?? { items: [], total: 0, page, pageSize }
}

export async function searchTags(q?: string): Promise<string[]> {
  const path = q ? `/search-tags?q=${encodeURIComponent(q)}` : '/search-tags'
  const result = await apiFetch<string[]>(path)
  return result ?? []
}

export async function searchUsers(q: string, role: string, page = 0, pageSize = 20, sort?: string, authorId?: number): Promise<UserSearchResult> {
  let path = `/search/users?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}&page=${page}&pageSize=${pageSize}`
  if (sort) path += `&sort=${encodeURIComponent(sort)}`
  if (authorId) path += `&authorId=${authorId}`
  const result = await apiFetch<UserSearchResult>(path)
  return result ?? { items: [], total: 0, page, pageSize }
}
