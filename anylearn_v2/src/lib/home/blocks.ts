import { buildSearchUrl, DEFAULT_ADVANCED, DEFAULT_FILTERS, type SearchState } from '@/lib/search/query'

// Who the home page is for right now: a child (or the owner) with an age range, or a visitor's answer with an age bucket.
export interface HomeLearner {
  name: string
  chipKey?: string
  ageFrom?: number
  ageTo?: number
  ageBucket?: string
}

export interface HomeContext {
  learner?: HomeLearner
  near?: { lat: number; lng: number }
}

export interface HomeBlock {
  title: string
  sort: string
  age?: string
  extra: [string, string][]
  seeAllHref: string
}

const HOME_RADIUS_KM = 15
const BASE_STATE: SearchState = { q: '', mode: 'class', sort: 'popular', page: 0, filters: DEFAULT_FILTERS, adv: DEFAULT_ADVANCED }

function learnerExtra(learner: HomeLearner): [string, string][] {
  const pairs: [string, string][] = []
  if (learner.ageFrom !== undefined) pairs.push(['ageFrom', String(learner.ageFrom)])
  if (learner.ageTo !== undefined) pairs.push(['ageTo', String(learner.ageTo)])
  return pairs
}

function learnerState(learner: HomeLearner): SearchState {
  const filters = learner.ageBucket ? { ...DEFAULT_FILTERS, age: learner.ageBucket } : DEFAULT_FILTERS
  return { ...BASE_STATE, filters, adv: { ...DEFAULT_ADVANCED, learner: learner.chipKey, ageFrom: learner.ageFrom, ageTo: learner.ageTo } }
}

// "Dành cho Bin": courses that fit the learner's age. With nobody chosen it is simply the most popular courses.
export function forYouBlock(ctx: HomeContext): HomeBlock {
  const { learner } = ctx
  if (!learner) return { title: 'Khóa học được quan tâm nhiều', sort: 'popular', extra: [], seeAllHref: buildSearchUrl(BASE_STATE) }
  return {
    title: `Dành cho ${learner.name}`,
    sort: 'popular',
    age: learner.ageBucket,
    extra: learnerExtra(learner),
    seeAllHref: buildSearchUrl(learnerState(learner)),
  }
}

// "Đang hot gần bạn": popular courses around a known point. Without a position there is nothing "near", so no block.
export function hotNearBlock(ctx: HomeContext): HomeBlock | null {
  if (!ctx.near) return null
  const near = ctx.near
  const state: SearchState = { ...BASE_STATE, adv: { ...DEFAULT_ADVANCED, near, radiusKm: HOME_RADIUS_KM } }
  return {
    title: 'Đang hot gần bạn',
    sort: 'popular',
    extra: [['nearLat', String(near.lat)], ['nearLng', String(near.lng)], ['radiusKm', String(HOME_RADIUS_KM)]],
    seeAllHref: buildSearchUrl(state),
  }
}

// Chips under the home search box: each opens the search with that filter on.
export function homeQuickLinks(): { label: string; href: string }[] {
  const link = (label: string, adv: Partial<SearchState['adv']>, filters = DEFAULT_FILTERS) =>
    ({ label, href: buildSearchUrl({ ...BASE_STATE, filters, adv: { ...DEFAULT_ADVANCED, ...adv } }) })
  return [
    { label: 'Gần tôi', href: '/search?locate=1' },
    link('Cuối tuần', { slots: ['weekend_morning', 'weekend_afternoon', 'weekend_evening'] }),
    link('Học thử', { freeTrial: true }),
    link('Giảm giá', { onSale: true }),
    link('Online', {}, { ...DEFAULT_FILTERS, hinhthuc: 'online' }),
  ]
}
