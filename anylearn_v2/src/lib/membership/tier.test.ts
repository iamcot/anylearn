import { describe, expect, it } from 'vitest'
import type { MyTier } from '@/lib/api/membership'
import { multiplierLine, nextTierLine, tierProgress } from './tier'

const tiers = [
  { key: 'member', label: 'Thành viên', minSpent: 0, multiplier: 1 },
  { key: 'silver', label: 'Bạc', minSpent: 3_000_000, multiplier: 1.2 },
  { key: 'gold', label: 'Vàng', minSpent: 10_000_000, multiplier: 1.5 },
  { key: 'diamond', label: 'Kim cương', minSpent: 30_000_000, multiplier: 2 },
]
const base: MyTier = { applies: true, tier: 'silver', label: 'Bạc', spent12m: 8_800_000, multiplier: 1.2, next: 'gold', nextLabel: 'Vàng', remaining: 1_200_000, tiers }

describe('tier helpers', () => {
  it('measures progress between two thresholds', () => {
    expect(tierProgress(base)).toBe(83)
    expect(tierProgress({ ...base, tier: 'diamond', next: null, nextLabel: null })).toBe(100)
  })

  it('says what is left to the next tier', () => {
    expect(nextTierLine(base)).toContain('Vàng')
    expect(nextTierLine({ ...base, next: null, nextLabel: null })).toContain('cao nhất')
  })

  it('only mentions a multiplier above one', () => {
    expect(multiplierLine(1)).toBeNull()
    expect(multiplierLine(1.5)).toContain('1,5')
  })
})
