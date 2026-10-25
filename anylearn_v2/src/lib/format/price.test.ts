import { describe, expect, it } from 'vitest'
import { formatExactPrice, formatPrice } from './price'

describe('formatPrice', () => {
  it('shows the empty label for a zero price', () => {
    expect(formatPrice(0)).toBe('Liên hệ')
    expect(formatPrice(0, '0 đ')).toBe('0 đ')
  })

  it('groups thousands below one million', () => {
    expect(formatPrice(500000)).toBe('500.000 đ')
  })

  it('shortens millions and drops a trailing .0', () => {
    expect(formatPrice(1_000_000)).toBe('1 triệu')
    expect(formatPrice(1_500_000)).toBe('1.5 triệu')
    expect(formatPrice(12_000_000)).toBe('12 triệu')
  })
})

describe('formatExactPrice', () => {
  it('never rounds to millions', () => {
    expect(formatExactPrice(1_500_000)).toBe('1.500.000 đ')
    expect(formatExactPrice(250_000)).toBe('250.000 đ')
  })
})
