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

// Points that can still lower the bill: the balance, and never more than the amount left after the voucher
// (extra points would be taken from the wallet without lowering the price).
export function maxUsablePoints(balance: number, subtotal: number, voucherDiscount: number): number {
  const amountLeft = Math.max(0, subtotal - Math.min(voucherDiscount, subtotal))
  return Math.max(0, Math.min(Math.floor(balance), Math.floor(amountLeft / POINT_VALUE_VND)))
}

export interface PointsChoice {
  on: boolean
  custom: number | null
}

// The switch uses the most points that help; "other amount" picks fewer. Follows the voucher without a new click.
export function pointsToApply(choice: PointsChoice, maxPoints: number): number {
  if (!choice.on) return 0
  return choice.custom === null ? maxPoints : clampPoints(choice.custom, maxPoints)
}
