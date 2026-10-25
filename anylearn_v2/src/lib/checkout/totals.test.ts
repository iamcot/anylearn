import { describe, expect, it } from 'vitest'
import { calcCheckoutTotals, clampPoints, maxUsablePoints, pointsToApply } from './totals'

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

describe('maxUsablePoints', () => {
  it('uses the whole balance when the order is bigger', () => {
    expect(maxUsablePoints(270, 1_500_000, 0)).toBe(270)
  })

  it('stops at the order amount so no point is wasted', () => {
    expect(maxUsablePoints(2_000, 1_500_000, 0)).toBe(1_500)
    expect(maxUsablePoints(2_000, 1_500_000, 500_000)).toBe(1_000)
  })

  it('is zero without balance, with a free order, or when the voucher covers everything', () => {
    expect(maxUsablePoints(0, 1_500_000, 0)).toBe(0)
    expect(maxUsablePoints(100, 0, 0)).toBe(0)
    expect(maxUsablePoints(100, 300_000, 400_000)).toBe(0)
  })

  it('rounds the amount down to whole points', () => {
    expect(maxUsablePoints(100, 1_500, 0)).toBe(1)
  })
})

describe('pointsToApply', () => {
  it('applies nothing while the switch is off', () => {
    expect(pointsToApply({ on: false, custom: 50 }, 270)).toBe(0)
  })

  it('applies the maximum when the switch is on', () => {
    expect(pointsToApply({ on: true, custom: null }, 270)).toBe(270)
  })

  it('applies a custom amount but never above the maximum', () => {
    expect(pointsToApply({ on: true, custom: 100 }, 270)).toBe(100)
    expect(pointsToApply({ on: true, custom: 900 }, 270)).toBe(270)
    expect(pointsToApply({ on: true, custom: 0 }, 270)).toBe(0)
  })
})
