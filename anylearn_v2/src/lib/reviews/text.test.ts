import { describe, expect, it } from 'vitest'
import { appendPhrase, distributionPercents, rewardHint, rewardThanks } from './text'

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

describe('rewardHint', () => {
  it('names both rewards', () => {
    expect(rewardHint({ textPoints: 20, mediaPoints: 30, minTextLength: 50 })).toBe('+20 anyPoint khi viết từ 50 ký tự, thêm +30 anyPoint khi có ảnh')
  })
  it('skips a reward that is off and is empty when both are', () => {
    expect(rewardHint({ textPoints: 0, mediaPoints: 30, minTextLength: 50 })).toBe('thêm +30 anyPoint khi có ảnh')
    expect(rewardHint({ textPoints: 0, mediaPoints: 0, minTextLength: 50 })).toBe('')
    expect(rewardHint(null)).toBe('')
  })
})

describe('rewardThanks', () => {
  it('mentions the points only when some were given', () => {
    expect(rewardThanks(20)).toContain('+20 anyPoint')
    expect(rewardThanks(0)).not.toContain('anyPoint')
  })
})
