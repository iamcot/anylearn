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

// Everything beyond the four classic selects (plan 04.2). Each field is one URL parameter, so a link shares the search.
export interface AdvancedFilters {
  // Chip of the learner the list is for ("c12" a child, "self", "g<localId>" a visitor's child); ageFrom/ageTo do the filtering.
  learner?: string
  ageFrom?: number
  ageTo?: number
  district?: string
  near?: { lat: number; lng: number }
  radiusKm?: number
  slots: string[]
  partnerType?: string
  freeTrial: boolean
  onSale: boolean
  priceMin?: number
  priceMax?: number
  startWithin?: number
  tags: number[]
}

export const DEFAULT_ADVANCED: AdvancedFilters = { slots: [], freeTrial: false, onSale: false, tags: [] }

export interface SearchState {
  q: string
  mode: SearchMode
  category?: string
  authorId?: number
  sort: string
  filters: SearchFilters
  adv: AdvancedFilters
  page: number
}

export const DEFAULT_FILTERS: SearchFilters = { age: ALL, price: ALL, location: ALL, hinhthuc: ALL }

function parseMode(value: string | null): SearchMode {
  return value === 'school' || value === 'teacher' ? value : 'class'
}

function optionalNumber(value: string | null, min = 0): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) && number >= min ? number : undefined
}

function parseNear(value: string | null): AdvancedFilters['near'] {
  const [lat, lng] = (value ?? '').split(',').map(Number)
  if (lat === undefined || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) return undefined
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : undefined
}

export function parseAdvancedParams(params: URLSearchParams): AdvancedFilters {
  const priceMin = optionalNumber(params.get('priceMin'))
  const priceMax = optionalNumber(params.get('priceMax'))
  return {
    learner: params.get('for') ?? undefined,
    ageFrom: optionalNumber(params.get('ageFrom')),
    ageTo: optionalNumber(params.get('ageTo')),
    district: params.get('district') ?? undefined,
    near: parseNear(params.get('near')),
    radiusKm: optionalNumber(params.get('radius'), 1),
    slots: params.getAll('slot'),
    partnerType: params.get('partnerType') ?? undefined,
    freeTrial: params.get('freeTrial') === '1',
    onSale: params.get('onSale') === '1',
    priceMin,
    priceMax,
    startWithin: optionalNumber(params.get('startWithin'), 1),
    tags: params.getAll('tag').map(Number).filter(id => Number.isInteger(id) && id > 0),
  }
}

export function parseSearchParams(params: URLSearchParams): SearchState {
  const authorId = Number(params.get('authorId'))
  return {
    q: params.get('q') ?? '',
    mode: parseMode(params.get('mode')),
    category: params.get('category') ?? undefined,
    authorId: authorId > 0 ? authorId : undefined,
    sort: params.get('sort') ?? DEFAULT_SORT,
    adv: parseAdvancedParams(params),
    page: Math.max(1, Math.floor(Number(params.get('page'))) || 1) - 1,
    filters: {
      age: params.get('age') ?? ALL,
      price: params.get('price') ?? ALL,
      location: params.get('location') ?? ALL,
      hinhthuc: params.get('hinhthuc') ?? ALL,
    },
  }
}

function setAdvancedParams(params: URLSearchParams, adv: AdvancedFilters) {
  const setNumber = (key: string, value: number | undefined) => { if (value !== undefined) params.set(key, String(value)) }
  if (adv.learner) params.set('for', adv.learner)
  setNumber('ageFrom', adv.ageFrom)
  setNumber('ageTo', adv.ageTo)
  if (adv.district) params.set('district', adv.district)
  if (adv.near) params.set('near', `${adv.near.lat},${adv.near.lng}`)
  setNumber('radius', adv.radiusKm)
  adv.slots.forEach(slot => params.append('slot', slot))
  if (adv.partnerType) params.set('partnerType', adv.partnerType)
  if (adv.freeTrial) params.set('freeTrial', '1')
  if (adv.onSale) params.set('onSale', '1')
  setNumber('priceMin', adv.priceMin)
  setNumber('priceMax', adv.priceMax)
  setNumber('startWithin', adv.startWithin)
  adv.tags.forEach(tag => params.append('tag', String(tag)))
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
  setAdvancedParams(params, state.adv)
  if (state.page > 0) params.set('page', String(state.page + 1))
  return `/search?${params.toString()}`
}

// What the filter panel counts: the quick chips and the learner chip have their own place, so they are not counted here.
export function activeAdvancedCount(adv: AdvancedFilters): number {
  const priceSet = adv.priceMin !== undefined || adv.priceMax !== undefined
  return [adv.district, adv.partnerType, adv.startWithin, priceSet || undefined]
    .filter(value => value !== undefined).length + (adv.slots.length > 0 ? 1 : 0) + (adv.tags.length > 0 ? 1 : 0)
}

export function activeFilterCount(state: Pick<SearchState, 'category' | 'filters'> & { adv?: AdvancedFilters }): number {
  const activeFilters = Object.values(state.filters).filter(value => value !== ALL).length
  return activeFilters + (state.category ? 1 : 0) + (state.adv ? activeAdvancedCount(state.adv) : 0)
}

// The query-string part of the advanced filters for GET /search.
export function advancedApiParams(adv: AdvancedFilters): [string, string][] {
  const pairs: [string, string][] = []
  const add = (key: string, value: number | string | undefined) => { if (value !== undefined) pairs.push([key, String(value)]) }
  add('ageFrom', adv.ageFrom)
  add('ageTo', adv.ageTo)
  add('district', adv.district)
  if (adv.near) {
    add('nearLat', adv.near.lat)
    add('nearLng', adv.near.lng)
    add('radiusKm', adv.radiusKm)
  }
  adv.slots.forEach(slot => add('timeSlot', slot))
  add('partnerType', adv.partnerType)
  if (adv.freeTrial) add('freeTrial', 'true')
  if (adv.onSale) add('onSale', 'true')
  add('priceMin', adv.priceMin)
  add('priceMax', adv.priceMax)
  add('startWithin', adv.startWithin)
  adv.tags.forEach(tag => add('tag', tag))
  return pairs
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
