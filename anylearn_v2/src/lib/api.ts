const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 }, ...options })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? json
  } catch {
    return null
  }
}

async function authFetch<T>(path: string, token: string, options?: RequestInit): Promise<{ data: T | null; error?: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options?.headers ?? {}) },
    })
    const json = await res.json()
    if (!res.ok) return { data: null, error: json?.message || 'Lỗi không xác định' }
    return { data: json?.data ?? json }
  } catch (e) {
    return { data: null, error: 'Không thể kết nối máy chủ' }
  }
}

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
  articles: unknown[]
  configs: Record<string, unknown>
  home_classes: { title: string; classes: Item[] }[]
  promotions: unknown[]
  events: Item[]
  categories: Category[]
}

export async function getCategories(): Promise<Category[]> {
  const result = await apiFetch<Category[]>('/config/category')
  return result ?? []
}

export interface UserProfile {
  id: number
  name: string
  role: string
  title?: string
  image?: string
  banner?: string
  introduce?: string
  full_content?: string
}

export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  return apiFetch<UserProfile>(`/user/profile/${userId}`)
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
}

export async function getPdpData(id: number): Promise<PdpData | null> {
  return apiFetch<PdpData>(`/pdp/${id}`)
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

// ── Auth ──────────────────────────────────────────────
export interface AuthUser {
  id: number
  name: string
  firstName?: string
  phone: string
  email?: string
  role: string
  image?: string
  walletM?: number
  walletC?: number
  apiToken: string
  jwtToken: string
}

export async function loginApi(phone: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const res = await fetch(`${BASE}/login?phone=${encodeURIComponent(phone)}&password=${encodeURIComponent(password)}`)
    const json = await res.json()
    if (!res.ok || json?.resultCode !== 1) return { user: null, error: json?.message || 'Đăng nhập thất bại' }
    return { user: json.data }
  } catch {
    return { user: null, error: 'Không thể kết nối máy chủ' }
  }
}

export async function registerApi(name: string, phone: string, email: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    const res = await fetch(`${BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, password }),
    })
    const json = await res.json()
    if (!res.ok || json?.resultCode !== 1) return { user: null, error: json?.message || 'Đăng ký thất bại' }
    return { user: json.data }
  } catch {
    return { user: null, error: 'Không thể kết nối máy chủ' }
  }
}

// ── Cart ──────────────────────────────────────────────
export interface CartInfoData {
  item: Item & { orgPrice?: number; nolimitTime?: string; authorName?: string }
  children: { id: number; name: string; image?: string }[]
  plans: { id: number; title?: string; weekdays?: string; date_start?: string; time_start?: string; location_title?: string; address?: string }[]
  categories: { id: number; title: string; url: string }[]
  activiyTrial: boolean
  activiyTest: boolean
  activiyVisit: boolean
}

export interface CartItem {
  cartItemId: number
  itemId: number
  title: string
  image?: string
  price: number
  orgPrice?: number
  dateStart?: string
  authorName?: string
  studentName?: string
  extra?: Record<string, unknown>
}

export interface OrderData {
  orderId: string
  items: { itemId: number; title: string; price: number; image?: string; dateStart?: string; seoUrl?: string }[]
  paymentMethod: string
}

export async function getCartInfo(itemId: number, token: string): Promise<CartInfoData | null> {
  const { data } = await authFetch<CartInfoData>(`/cart-info/${itemId}`, token)
  return data
}

export async function addToCart(payload: {
  itemId: number; studentId?: number; planId?: number
  trialType?: string; trialDate?: string; trialNote?: string
}, token: string): Promise<{ data: { cartItemId: number; cartCount: number } | null; error?: string }> {
  return authFetch(`/cart/add`, token, { method: 'POST', body: JSON.stringify(payload) })
}

export async function getCart(token: string): Promise<CartItem[]> {
  const { data } = await authFetch<CartItem[]>(`/cart`, token)
  return data ?? []
}

export async function removeCartItem(actionId: number, token: string): Promise<void> {
  await authFetch(`/cart/${actionId}`, token, { method: 'DELETE' })
}

export async function checkout(payload: {
  paymentMethod: string; couponCode?: string; pointsUsed?: number
}, token: string): Promise<{ data: OrderData | null; error?: string }> {
  return authFetch(`/checkout`, token, { method: 'POST', body: JSON.stringify(payload) })
}

export async function getOrder(orderId: string, token: string): Promise<OrderData | null> {
  const { data } = await authFetch<OrderData>(`/order/${orderId}`, token)
  return data
}
