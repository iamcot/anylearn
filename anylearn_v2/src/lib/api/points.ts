import { apiFetch } from './client'

export interface PointsPreview {
  itemId: number
  points: number
  vndValue: number
}

export async function getPointsPreview(itemId: number): Promise<PointsPreview | null> {
  return apiFetch<PointsPreview>(`/points/preview?itemId=${itemId}`)
}
