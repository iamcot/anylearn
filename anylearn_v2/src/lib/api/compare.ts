import { API_BASE } from '@/lib/apiBase'

export interface CompareCourse {
  id: number
  title: string
  image: string | null
  seoUrl: string | null
  subtype: string | null
  partnerId: number | null
  partnerName: string | null
  price: number | null
  orgPrice: number | null
  sessions: number | null
  pricePerSession: number | null
  schedules: string[]
  dateStart: string | null
  ages: string | null
  distanceKm: number | null
  branchCount: number
  ratingAverage: number | null
  ratingCount: number
  freeTrial: boolean
  points: number
}

export interface CompareFigures {
  courses: CompareCourse[]
  /** Row key to the column index with the clearly best figure (lowest price, nearest...). Absent when tied or unknown. */
  best: Record<string, number>
  mixedFormats: boolean
  missing: number[]
  factLabels: Record<string, string>
}

export interface CompareHighlights {
  enabled: boolean
  courses: Record<string, Record<string, string>>
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? null) as T | null
  } catch {
    return null
  }
}

export function getCompareFigures(ids: number[], point?: { lat: number; lng: number } | null): Promise<CompareFigures | null> {
  const near = point ? `&lat=${point.lat}&lng=${point.lng}` : ''
  return get<CompareFigures>(`/compare?ids=${ids.join(',')}${near}`)
}

export function getCompareHighlights(ids: number[]): Promise<CompareHighlights | null> {
  return get<CompareHighlights>(`/compare/highlights?ids=${ids.join(',')}`)
}
