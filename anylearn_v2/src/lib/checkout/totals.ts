import { POINT_VALUE_VND } from '@/config/points'

export interface CheckoutTotals {
  total: number
  pointsDiscount: number
  voucherDiscount: number
  finalTotal: number
}

export function calcCheckoutTotals(total: number, pointsApplied: number, voucherValue: number): CheckoutTotals {
  const pointsDiscount = Math.min(pointsApplied * POINT_VALUE_VND, total)
  const voucherDiscount = Math.min(voucherValue, total)
  return { total, pointsDiscount, voucherDiscount, finalTotal: Math.max(0, total - pointsDiscount - voucherDiscount) }
}

export function clampPoints(requested: number, balance: number): number {
  if (!Number.isFinite(requested) || requested <= 0) return 0
  return Math.min(Math.floor(requested), Math.max(0, balance))
}
