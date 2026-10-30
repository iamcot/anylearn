import { describe, expect, it } from 'vitest'
import { isPublicFunPath, keptQuery, publicPostId } from './publicPath'

describe('public Khám phá path', () => {
  it('matches only the post page', () => {
    expect(isPublicFunPath('/fun/explore/12/meo-hay')).toBe(true)
    expect(isPublicFunPath('/fun/explore/12')).toBe(true)
    expect(isPublicFunPath('/fun/explore')).toBe(false)
    expect(isPublicFunPath('/fun/explore/mine')).toBe(false)
    expect(isPublicFunPath('/fun/explore/compose')).toBe(false)
    expect(isPublicFunPath('/fun/quiz')).toBe(false)
  })
  it('reads the post id', () => {
    expect(publicPostId('/fun/explore/12/meo-hay')).toBe(12)
    expect(publicPostId('/fun/explore/mine')).toBeNull()
  })
  it('keeps the query string except the old p', () => {
    expect(keptQuery({ p: '5', utm_source: 'facebook', tag: ['a', 'b'] })).toBe('?utm_source=facebook&tag=a&tag=b')
    expect(keptQuery({ p: '5' })).toBe('')
  })
})
