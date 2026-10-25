import { describe, expect, it } from 'vitest'
import { calcCheckoutTotals, clampPoints } from './totals'

describe('calcCheckoutTotals', () => {
  it('subtracts points (1 point = 1,000 VND) and the voucher', () => {
    expect(calcCheckoutTotals(5_000_000, 100, 200_000)).toEqual({
      total: 5_000_000, pointsDiscount: 100_000, voucherDiscount: 200_000, finalTotal: 4_700_000,
    })
  })

  it('caps each discount at the order total and never goes below zero', () => {
    const totals = calcCheckoutTotals(300_000, 1_000, 250_000)
    expect(totals.pointsDiscount).toBe(300_000)
    expect(totals.voucherDiscount).toBe(250_000)
    expect(totals.finalTotal).toBe(0)
  })

  it('has no discount without points or voucher', () => {
    expect(calcCheckoutTotals(1_000_000, 0, 0).finalTotal).toBe(1_000_000)
  })
})

describe('clampPoints', () => {
  it('limits the request to the wallet balance', () => {
    expect(clampPoints(500, 120)).toBe(120)
    expect(clampPoints(50, 120)).toBe(50)
  })

  it('treats empty, negative or invalid input as zero', () => {
    expect(clampPoints(Number.NaN, 120)).toBe(0)
    expect(clampPoints(-5, 120)).toBe(0)
    expect(clampPoints(10, -3)).toBe(0)
  })
})
