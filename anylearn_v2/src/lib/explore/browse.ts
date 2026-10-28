import type { ExplorePost } from '@/lib/api/explore'

/**
 * The list the grid on /fun shows (search results or the suggested feed), kept in memory so the full-screen viewer opened
 * from a tile goes on with the same list and pages instead of starting over. Lost on a reload, then the viewer starts from
 * the post alone and the feed.
 */
export interface BrowseList {
  q: string
  since: number
  posts: ExplorePost[]
  page: number
  total: number
}

let current: BrowseList | null = null

export function rememberBrowse(list: BrowseList) {
  current = list
}

export function browseList(): BrowseList | null {
  return current
}
