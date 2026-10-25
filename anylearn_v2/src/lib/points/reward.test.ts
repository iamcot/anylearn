import { describe, expect, it } from 'vitest'
import { cartRewardLabel, earnedLabel, rewardLabel, sumCartPoints } from './reward'

describe('rewardLabel', () => {
  it('shows the points and what they are worth', () => {
    expect(rewardLabel(150, 150_000)).toBe('Nhận +150 anyPoint (~150.000đ)')
  })

  it('falls back to the standard point value', () => {
    expect(rewardLabel(80)).toBe('Nhận +80 anyPoint (~80.000đ)')
  })
})

describe('sumCartPoints', () => {
  it('adds the lines and ignores missing or negative values', () => {
    expect(sumCartPoints([{ points: 80 }, { points: 120 }, {}, { points: -5 }])).toBe(200)
    expect(sumCartPoints([])).toBe(0)
  })
})

describe('earnedLabel', () => {
  it('adds the balance when it is known', () => {
    expect(earnedLabel(80, 1_270)).toBe('Đã cộng 80 anyPoint, số dư 1.270 anyPoint')
    expect(earnedLabel(80)).toBe('Đã cộng 80 anyPoint')
  })
})

describe('cartRewardLabel', () => {
  it('speaks about the whole order', () => {
    expect(cartRewardLabel(200)).toBe('Đơn này bạn sẽ nhận +200 anyPoint (~200.000đ)')
  })
})
