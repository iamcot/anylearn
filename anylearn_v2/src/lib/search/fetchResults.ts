import { searchItems, searchUsers, type Item, type UserResult } from '@/lib/api'
import type { SearchTracking } from './searchTracking'
import { SEARCH_PAGE_SIZE, toApiFilters, type SearchState } from './query'

export interface SearchResults {
  items: Item[]
  users: UserResult[]
  total: number
}

export async function fetchSearchResults(state: SearchState, tracking?: SearchTracking): Promise<SearchResults> {
  if (state.mode === 'class') {
    const { age, priceRange, location, hinhthuc } = toApiFilters(state.filters)
    const data = await searchItems(
      state.q, state.page, SEARCH_PAGE_SIZE, state.category, state.sort, state.authorId, age, priceRange, location, hinhthuc, tracking,
    )
    return { items: data.items, users: [], total: data.total }
  }
  const data = await searchUsers(state.q, state.mode, state.page, SEARCH_PAGE_SIZE, state.sort, state.authorId, tracking)
  return { items: [], users: data.items, total: data.total }
}
