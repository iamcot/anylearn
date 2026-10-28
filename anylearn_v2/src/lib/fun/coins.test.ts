import { describe, expect, it } from 'vitest'
import { coinSourceLabel, pageCount } from './coins'

describe('coins', () => {
  it('labels known sources and keeps unknown ones', () => {
    expect(coinSourceLabel('checkin')).toBe('Quà điểm danh')
    expect(coinSourceLabel('x')).toBe('x')
  })
  it('counts pages, at least one', () => {
    expect(pageCount(0, 20)).toBe(1)
    expect(pageCount(41, 20)).toBe(3)
  })
})
