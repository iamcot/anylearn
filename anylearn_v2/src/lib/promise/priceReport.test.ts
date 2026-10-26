import { describe, expect, it } from 'vitest'
import { checkPriceReport, type PriceReportForm } from './priceReport'

const form = (overrides: Partial<PriceReportForm> = {}): PriceReportForm => ({
  seenPlace: 'Trường ABC', seenPrice: '1.200.000', note: ' thấy trên website ', phone: '0912 345 678', ...overrides,
})

describe('checkPriceReport', () => {
  it('builds the payload from a complete form', () => {
    expect(checkPriceReport(form(), false, 5)).toEqual({
      ok: true,
      payload: { itemId: 5, seenPlace: 'Trường ABC', seenPrice: 1_200_000, note: 'thấy trên website', phone: '0912345678' },
    })
  })

  it('asks where the lower price was seen', () => {
    const check = checkPriceReport(form({ seenPlace: '  ' }), true)
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.errors.seenPlace).toBeDefined()
  })

  it('needs a phone only without an account', () => {
    const visitor = checkPriceReport(form({ phone: '' }), false)
    expect(visitor.ok).toBe(false)
    expect(checkPriceReport(form({ phone: '' }), true).ok).toBe(true)
  })

  it('rejects a wrong phone number and an impossible price', () => {
    const check = checkPriceReport(form({ phone: '123', seenPrice: '-5' }), true)
    expect(check.ok).toBe(false)
    if (!check.ok) expect(Object.keys(check.errors).sort()).toEqual(['phone', 'seenPrice'])
  })

  it('treats the price as optional', () => {
    const check = checkPriceReport(form({ seenPrice: '' }), false)
    expect(check.ok && check.payload.seenPrice).toBeUndefined()
  })
})
