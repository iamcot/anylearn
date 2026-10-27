import { describe, expect, it } from 'vitest'
import { pickFresh } from './dedupe'

const items = (ids: number[]) => ids.map(id => ({ id }))

describe('pickFresh', () => {
  it('drops courses seen above and keeps the order', () => {
    expect(pickFresh(items([1, 2, 3, 4, 5, 6, 7]), new Set([2, 3]), 8, 4).map(i => i.id)).toEqual([1, 4, 5, 6, 7])
  })
  it('hides the row when too few are fresh', () => {
    expect(pickFresh(items([1, 2, 3, 4, 5]), new Set([1, 2, 3]), 8, 4)).toEqual([])
  })
  it('first row has nothing to exclude and shows even a short list', () => {
    expect(pickFresh(items([1, 2]), new Set(), 8, 4).map(i => i.id)).toEqual([1, 2])
  })
  it('cuts to the row size', () => {
    expect(pickFresh(items([1, 2, 3, 4, 5]), new Set(), 3, 4)).toHaveLength(3)
  })
  it('keeps repeats after the fresh ones when asked, so the row stays', () => {
    expect(pickFresh(items([1, 2, 3, 4]), new Set([1, 2, 3]), 8, 4, true).map(i => i.id)).toEqual([4, 1, 2, 3])
  })
})
