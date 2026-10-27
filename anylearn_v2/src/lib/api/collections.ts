import { apiFetch } from './client'
import type { Item } from './catalog'

export interface CollectionCard {
  id: number
  slug: string
  title: string
  subtitle?: string | null
  cover?: string | null
  itemCount: number
}

export interface CollectionPage {
  id: number
  slug: string
  title: string
  subtitle?: string | null
  cover?: string | null
  items: Item[]
}

// Hand-picked lists of courses ("Hè không màn hình"), only the ones in season with at least one open course.
export async function getCollections(): Promise<CollectionCard[]> {
  return (await apiFetch<CollectionCard[]>('/collections')) ?? []
}

export async function getCollection(slug: string): Promise<CollectionPage | null> {
  return apiFetch<CollectionPage>(`/collections/${encodeURIComponent(slug)}`)
}

// The collections (in season) that list this course, for the course page.
export async function getCollectionsOfItem(itemId: number): Promise<CollectionCard[]> {
  return (await apiFetch<CollectionCard[]>(`/collections?itemId=${itemId}`)) ?? []
}
