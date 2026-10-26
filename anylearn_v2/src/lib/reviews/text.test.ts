import { describe, expect, it } from 'vitest'
import { appendPhrase, distributionPercents } from './text'

describe('appendPhrase', () => {
  it('starts and continues a comment', () => {
    expect(appendPhrase('', 'Lớp vui')).toBe('Lớp vui')
    expect(appendPhrase('Con thích', 'Lớp vui')).toBe('Con thích. Lớp vui')
    expect(appendPhrase('Con thích.', 'Lớp vui')).toBe('Con thích. Lớp vui')
  })

  it('does not repeat a phrase', () => {
    expect(appendPhrase('Lớp vui lắm', 'lớp vui')).toBe('Lớp vui lắm')
  })
})

describe('distributionPercents', () => {
  it('turns counts into percents', () => {
    expect(distributionPercents({ '5': 3, '4': 1 }, 4)).toEqual([
      { stars: 5, percent: 75 }, { stars: 4, percent: 25 }, { stars: 3, percent: 0 }, { stars: 2, percent: 0 }, { stars: 1, percent: 0 },
    ])
    expect(distributionPercents({}, 0).every(row => row.percent === 0)).toBe(true)
  })
})
