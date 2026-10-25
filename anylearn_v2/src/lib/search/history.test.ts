import { describe, expect, it } from 'vitest'
import { SEARCH_HISTORY_KEY, addSearchTerm, readSearchHistory } from './history'

describe('addSearchTerm', () => {
  it('puts the newest term first and removes the duplicate', () => {
    expect(addSearchTerm(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c'])
  })

  it('ignores blank terms and keeps at most 8 entries', () => {
    expect(addSearchTerm(['a'], '   ')).toEqual(['a'])
    const long = Array.from({ length: 8 }, (_, index) => `t${index}`)
    expect(addSearchTerm(long, 'new')).toHaveLength(8)
  })
})

describe('readSearchHistory', () => {
  it('returns an empty list for missing or broken data', () => {
    expect(readSearchHistory({ getItem: () => null })).toEqual([])
    expect(readSearchHistory({ getItem: () => '{oops' })).toEqual([])
    expect(readSearchHistory({ getItem: () => '{"a":1}' })).toEqual([])
  })

  it('reads only strings', () => {
    const storage = { getItem: (key: string) => (key === SEARCH_HISTORY_KEY ? '["x",1,"y"]' : null) }
    expect(readSearchHistory(storage)).toEqual(['x', 'y'])
  })
})
