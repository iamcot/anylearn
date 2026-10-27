import { describe, expect, it } from 'vitest'
import { expiryLine, formatIsoDay, hasNotStarted, type MyPointExpiry, type PointExpiryPolicy } from './expiry'

const policy: PointExpiryPolicy = { enabled: true, months: 12, startDate: '2027-01-01', firstExpiryDay: '2028-01-01', firstLastUsableDay: '2027-12-31' }
const mine = (over: Partial<MyPointExpiry>): MyPointExpiry => ({ ...policy, applies: true, schedule: [], next: null, ...over })

describe('point expiry text', () => {
  it('writes a day as dd/MM/yyyy', () => {
    expect(formatIsoDay('2027-12-31')).toBe('31/12/2027')
  })

  it('says until which day the next points can be used', () => {
    const line = expiryLine(mine({ next: { lastUsableDay: '2027-12-31', points: 1200 } }))
    expect(line).toContain('31/12/2027')
    expect(line).toContain('anyPoint')
  })

  it('says nothing for a partner, a switched off rule or when nothing expires', () => {
    expect(expiryLine(null)).toBeNull()
    expect(expiryLine(mine({ applies: false, next: { lastUsableDay: '2027-12-31', points: 10 } }))).toBeNull()
    expect(expiryLine(mine({}))).toBeNull()
  })

  it('knows whether the rule has started', () => {
    expect(hasNotStarted(policy, new Date(2026, 9, 27))).toBe(true)
    expect(hasNotStarted(policy, new Date(2027, 0, 1))).toBe(false)
  })
})
