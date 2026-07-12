const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? json
  } catch {
    return null
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

export async function getHomeV2(): Promise<HomeData | null> {
  return apiFetch<HomeData>('/config/homev2/buyer')
}

export interface SearchResult {
  items: Item[]
  total: number
  page: number
  pageSize: number
}

export async function searchItems(q: string, page = 0, pageSize = 20, category?: string, sort?: string): Promise<SearchResult> {
  let path = `/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`
  if (category) path += `&category=${encodeURIComponent(category)}`
  if (sort) path += `&sort=${encodeURIComponent(sort)}`
  const result = await apiFetch<SearchResult>(path)
  return result ?? { items: [], total: 0, page, pageSize }
}

export async function searchTags(q?: string): Promise<string[]> {
  const path = q ? `/search-tags?q=${encodeURIComponent(q)}` : '/search-tags'
  const result = await apiFetch<string[]>(path)
  return result ?? []
}
