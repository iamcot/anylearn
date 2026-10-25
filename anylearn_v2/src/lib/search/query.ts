import { FILTER_ALL } from '@/config/searchFilters'

export type SearchMode = 'class' | 'school' | 'teacher'

export const SEARCH_PAGE_SIZE = 20
const ALL = FILTER_ALL
const DEFAULT_SORT = 'popular'

export interface SearchFilters {
  age: string
  price: string
  location: string
  hinhthuc: string
}

export interface SearchState {
  q: string
  mode: SearchMode
  category?: string
  authorId?: number
  sort: string
  filters: SearchFilters
  page: number
}

export const DEFAULT_FILTERS: SearchFilters = { age: ALL, price: ALL, location: ALL, hinhthuc: ALL }

function parseMode(value: string | null): SearchMode {
  return value === 'school' || value === 'teacher' ? value : 'class'
}

export function parseSearchParams(params: URLSearchParams): SearchState {
  const authorId = Number(params.get('authorId'))
  return {
    q: params.get('q') ?? '',
    mode: parseMode(params.get('mode')),
    category: params.get('category') ?? undefined,
    authorId: authorId > 0 ? authorId : undefined,
    sort: params.get('sort') ?? DEFAULT_SORT,
    page: Math.max(1, Math.floor(Number(params.get('page'))) || 1) - 1,
    filters: {
      age: params.get('age') ?? ALL,
      price: params.get('price') ?? ALL,
      location: params.get('location') ?? ALL,
      hinhthuc: params.get('hinhthuc') ?? ALL,
    },
  }
}

export function buildSearchUrl(state: SearchState): string {
  const params = new URLSearchParams()
  if (state.q) params.set('q', state.q)
  if (state.mode !== 'class') params.set('mode', state.mode)
  if (state.category) params.set('category', state.category)
  if (state.authorId) params.set('authorId', String(state.authorId))
  if (state.sort !== DEFAULT_SORT) params.set('sort', state.sort)
  for (const [key, value] of Object.entries(state.filters)) {
    if (value !== ALL) params.set(key, value)
  }
  if (state.page > 0) params.set('page', String(state.page + 1))
  return `/search?${params.toString()}`
}

export function activeFilterCount(state: Pick<SearchState, 'category' | 'filters'>): number {
  const activeFilters = Object.values(state.filters).filter(value => value !== ALL).length
  return activeFilters + (state.category ? 1 : 0)
}

export interface ApiFilters {
  age?: string
  priceRange?: string
  location?: string
  hinhthuc?: string
}

export function toApiFilters(filters: SearchFilters): ApiFilters {
  const orUndefined = (value: string) => (value === ALL ? undefined : value)
  return {
    age: orUndefined(filters.age),
    priceRange: orUndefined(filters.price),
    location: orUndefined(filters.location),
    hinhthuc: orUndefined(filters.hinhthuc),
  }
}
