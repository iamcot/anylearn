import { describe, expect, it } from 'vitest'
import { describeTransaction, sumPendingPoints } from './history'

describe('describeTransaction', () => {
  it('names the reward of an own purchase after the order', () => {
    expect(describeTransaction({ type: 'commission', amount: 80, status: 1, orderId: 42 })).toEqual({ title: 'anyPoint từ đơn #42', tone: 'earn' })
  })

  it('treats a commission without an order as a referral reward', () => {
    expect(describeTransaction({ type: 'commission', amount: 20, status: 1 }).title).toBe('anyPoint giới thiệu bạn bè')
  })

  it('shows spent and refunded points with their order', () => {
    expect(describeTransaction({ type: 'exchange', amount: -50, status: 1, orderId: 7 })).toEqual({ title: 'Dùng anyPoint cho đơn #7', tone: 'spend' })
    expect(describeTransaction({ type: 'exchange_refund', amount: 50, status: 1, orderId: 7 }).title).toBe('Hoàn anyPoint đơn #7')
  })

  it('has a neutral fallback for unknown types', () => {
    expect(describeTransaction({ type: 'something', amount: 5, status: 1 })).toEqual({ title: 'Thay đổi anyPoint', tone: 'neutral' })
  })
})

describe('sumPendingPoints', () => {
  it('adds only positive points that wait for approval', () => {
    expect(sumPendingPoints([
      { type: 'commission', amount: 80, status: 0 },
      { type: 'commission', amount: 20, status: 1 },
      { type: 'exchange', amount: -30, status: 0 },
      { type: 'commission', amount: 10, status: 0 },
    ])).toBe(90)
  })
})
