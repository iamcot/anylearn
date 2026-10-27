import { describe, expect, it } from 'vitest'
import type { CompareCourse } from '@/lib/api/compare'
import { pointsText, visibleRows } from './rows'

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
  it('always keeps the class / session row, even when no course has the information', () => {
    const none = { ...base, schedules: [], sessions: null }
    expect(visibleRows([none, { ...none, id: 2 }]).map(row => row.key)).toContain('classes')
  })
  it('keeps a row when one course has it', () => {
    const keys = visibleRows([base, { ...base, id: 2, distanceKm: 3.2 }]).map(row => row.key)
    expect(keys).toContain('distanceKm')
  })
  it('shows 0 anyPoint (never "no information") for a course that earns none, e.g. a fee item', () => {
    const row = visibleRows([{ ...base, isPaymentFee: true }]).find(r => r.key === 'points')!
    expect(row.cell({ ...base, isPaymentFee: true })).toBe('0 anyPoint')
  })
  it('writes the rating with its count', () => {
    const row = visibleRows([{ ...base, ratingAverage: 4.5, ratingCount: 12 }]).find(r => r.key === 'rating')!
    expect(row.cell({ ...base, ratingAverage: 4.5, ratingCount: 12 })).toBe('4,5 ★ từ 12 đánh giá')
  })
})

describe('pointsText', () => {
  it('adds the share of the price', () => {
    expect(pointsText(120, 2_000_000)).toBe('120 anyPoint (~6% giá mua)')
    expect(pointsText(30, 2_000_000)).toBe('30 anyPoint (~1,5% giá mua)')
  })
  it('has no share without a price, and shows 0 without points', () => {
    expect(pointsText(50, null)).toBe('50 anyPoint')
    expect(pointsText(0, 1_000_000)).toBe('0 anyPoint')
  })
})
