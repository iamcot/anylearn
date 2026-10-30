import { apiFetch } from './client'
import type { Item } from './catalog'
import type { LandingLink } from '@/lib/landing/landing'

export interface LandingPage {
  path: string
  title: string
  description: string
  intro: string
  tagId: number
  tagName: string
  age: number
  districtCode: string
  districtName: string
  provinceCode: string
  provinceName: string
  total: number
  items: Item[]
  faq: { question: string; answer: string }[]
  updatedAt: string | null
  related: LandingLink[]
}

/** Null when the page is unknown, switched off or has fewer than 3 courses. Cached 10 minutes. */
export async function getLandingPage(path: string): Promise<LandingPage | null> {
  const page = await apiFetch<LandingPage>(`/landing?path=${encodeURIComponent(path)}`, { next: { revalidate: 600 } })
  return page && page.path ? page : null
}
