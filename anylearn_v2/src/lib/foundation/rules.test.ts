import { describe, expect, it } from 'vitest'
import { barPercent, houseOrdinal, houseTitle, housesBadge, itemLine, vnd } from './rules'

describe('foundation rules', () => {
  it('keeps Leo on the bar', () => {
    expect(barPercent(0)).toBe(0)
    expect(barPercent(0.4)).toBe(2)
    expect(barPercent(57)).toBe(57)
    expect(barPercent(130)).toBe(100)
  })

  it('names houses by order, never "số 1"', () => {
    expect(houseOrdinal(1)).toBe('căn đầu tiên')
    expect(houseOrdinal(2)).toBe('căn thứ 2')
    expect(houseTitle(1)).toBe('Căn đầu tiên')
    expect(houseTitle(5)).toBe('Căn thứ 5')
  })

  it('formats texts', () => {
    expect(vnd(12500000)).toMatch(/^12.500.000đ$/)
    expect(housesBadge(0)).toBeNull()
    expect(housesBadge(3)).toBe('X3')
    expect(itemLine('1 bao gạch')).toBe('Đăng ký khóa này góp 1 bao gạch cho anyLEARN Foundation')
    expect(itemLine(null)).toBeNull()
  })
})
