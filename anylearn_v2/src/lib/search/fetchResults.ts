import { searchItems, searchUsers, type Item, type UserResult } from '@/lib/api'
import type { SearchTracking } from './searchTracking'
import { SEARCH_PAGE_SIZE, advancedApiParams, toApiFilters, type SearchState } from './query'

export interface SearchResults {
  items: Item[]
  users: UserResult[]
  total: number
}

export async function fetchSearchResults(state: SearchState, tracking?: SearchTracking): Promise<SearchResults> {
  if (state.mode === 'class') {
    const { age, priceRange, location, hinhthuc } = toApiFilters(state.filters)
    const data = await searchItems(
      state.q, state.page, SEARCH_PAGE_SIZE,
      { category: state.category, sort: state.sort, authorId: state.authorId, age, priceRange, location, mode: hinhthuc, extra: advancedApiParams(state.adv) },
      tracking,
    )
    return { items: data.items, users: [], total: data.total }
  }
  const data = await searchUsers(state.q, state.mode, state.page, SEARCH_PAGE_SIZE, state.sort, state.authorId, tracking)
  return { items: [], users: data.items, total: data.total }
}
