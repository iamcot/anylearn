import { describe, expect, it } from 'vitest'
import { pageItems } from './pagination'

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(pageItems(0, 3)).toEqual([0, 1, 2])
  })

  it('collapses distant pages into a gap', () => {
    expect(pageItems(0, 10)).toEqual([0, 1, 'gap', 9])
    expect(pageItems(5, 10)).toEqual([0, 'gap', 4, 5, 6, 'gap', 9])
    expect(pageItems(9, 10)).toEqual([0, 'gap', 8, 9])
  })

  it('does not add a gap between neighbours', () => {
    expect(pageItems(2, 5)).toEqual([0, 1, 2, 3, 4])
  })
})
