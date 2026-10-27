import { describe, expect, it } from 'vitest'
import type { CompareCourse } from '@/lib/api/compare'
import { visibleRows } from './rows'

const base: CompareCourse = {
  id: 1, title: 'A', image: null, seoUrl: null, subtype: 'offline', categories: [], partnerId: 1, partnerName: 'P', price: 1_000_000, orgPrice: null,
  sessions: 10, pricePerSession: 100_000, schedules: ['T2 · 18:00-19:30'], dateStart: null, ages: null, distanceKm: null, branchCount: 1,
  ratingAverage: null, ratingCount: 0, freeTrial: false, points: 0,
}

describe('visibleRows', () => {
  it('drops rows nobody has information for', () => {
    const keys = visibleRows([base, { ...base, id: 2 }]).map(row => row.key)
    expect(keys).toContain('price')
    expect(keys).not.toContain('distanceKm')
    expect(keys).not.toContain('rating')
    expect(keys).not.toContain('freeTrial')
  })
  it('keeps a row when one course has it', () => {
    const keys = visibleRows([base, { ...base, id: 2, distanceKm: 3.2 }]).map(row => row.key)
    expect(keys).toContain('distanceKm')
  })
  it('writes the rating with its count', () => {
    const row = visibleRows([{ ...base, ratingAverage: 4.5, ratingCount: 12 }]).find(r => r.key === 'rating')!
    expect(row.cell({ ...base, ratingAverage: 4.5, ratingCount: 12 })).toBe('4,5 sao từ 12 đánh giá')
  })
})
