import { describe, expect, it } from 'vitest'
import type { PendingOrder } from '@/lib/api/orders'
import { findDuplicateForCart, findDuplicatePendingOrder } from './pendingOrders'

const order = (orderId: string, itemId: number, learnerId: number | null, scheduleId: number | null = null): PendingOrder => ({
  orderId, amount: 1_000_000, paymentMethod: 'bank_transfer', status: 'pay_pending',
  items: [{ itemId, title: 'Bóng đá', learnerId, scheduleId }],
})

describe('findDuplicatePendingOrder', () => {
  const pending = [order('2814', 5, 50), order('2813', 5, 51)]

  it('finds the unpaid order of the same course and learner', () => {
    expect(findDuplicatePendingOrder(pending, { itemId: 5, learnerId: 50 })?.orderId).toBe('2814')
    expect(findDuplicatePendingOrder(pending, { itemId: 5, learnerId: 51 })?.orderId).toBe('2813')
  })

  it('ignores another course or another learner', () => {
    expect(findDuplicatePendingOrder(pending, { itemId: 6, learnerId: 50 })).toBeNull()
    expect(findDuplicatePendingOrder(pending, { itemId: 5, learnerId: 99 })).toBeNull()
  })

  it('treats a different slot of the same course as a different order', () => {
    const withSchedule = [order('1', 5, 50, 10)]
    expect(findDuplicatePendingOrder(withSchedule, { itemId: 5, learnerId: 50, scheduleId: 10 })?.orderId).toBe('1')
    expect(findDuplicatePendingOrder(withSchedule, { itemId: 5, learnerId: 50, scheduleId: 11 })).toBeNull()
    expect(findDuplicatePendingOrder(withSchedule, { itemId: 5, learnerId: 50 })).toBeNull()
  })

  it('does not match when there is nothing pending', () => {
    expect(findDuplicatePendingOrder([], { itemId: 5, learnerId: 50 })).toBeNull()
  })
})

describe('findDuplicateForCart', () => {
  it('reads the slot from the cart line extra and returns the first duplicate', () => {
    const pending = [order('7', 5, 50, 10)]
    const lines = [
      { itemId: 9, learnerId: 50 },
      { itemId: 5, learnerId: 50, extra: { scheduleId: 10 } },
    ]
    expect(findDuplicateForCart(pending, lines)?.orderId).toBe('7')
    expect(findDuplicateForCart(pending, [{ itemId: 5, learnerId: 50, extra: { scheduleId: 11 } }])).toBeNull()
  })
})
