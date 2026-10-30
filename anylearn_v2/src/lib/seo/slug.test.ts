import { describe, expect, it } from 'vitest'
import { MAX_SLUG, slugify } from './slug'

describe('slugify', () => {
  it('drops accents and punctuation', () => {
    expect(slugify('Bé học Bơi: 5 tuổi!')).toBe('be-hoc-boi-5-tuoi')
    expect(slugify('Đường đua Điều Kỳ')).toBe('duong-dua-dieu-ky')
  })
  it('falls back when nothing is left', () => {
    expect(slugify('!!!')).toBe('bai-viet')
    expect(slugify(null)).toBe('bai-viet')
  })
  it('cuts long text without a trailing dash', () => {
    const slug = slugify('a '.repeat(100))
    expect(slug.length).toBeLessThanOrEqual(MAX_SLUG)
    expect(slug.endsWith('-')).toBe(false)
  })
})
