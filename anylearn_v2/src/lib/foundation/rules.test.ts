import { describe, expect, it } from 'vitest'
import { filledRows, houseStage, housesBadge, itemLine, vnd } from './rules'

describe('foundation rules', () => {
  it('fills the house picture by percent', () => {
    expect(filledRows(0)).toBe(0)
    expect(filledRows(0.1)).toBe(1)
    expect(filledRows(50)).toBe(4)
    expect(filledRows(100)).toBe(8)
    expect(houseStage(10)).toBe('bricks')
    expect(houseStage(30)).toBe('walls')
    expect(houseStage(60)).toBe('roof')
    expect(houseStage(80)).toBe('door')
    expect(houseStage(100)).toBe('done')
  })

  it('formats texts', () => {
    expect(vnd(12500000)).toMatch(/^12.500.000đ$/)
    expect(housesBadge(0)).toBeNull()
    expect(housesBadge(3)).toBe('X3')
    expect(itemLine('1 xô gạch')).toBe('Đăng ký khóa này góp 1 xô gạch cho anyLEARN Foundation')
    expect(itemLine(null)).toBeNull()
  })
})
