import { describe, expect, it } from 'vitest'
import { idsFromQuery, parseStored, toggleEntry, type CompareEntry } from './selection'

const e = (id: number): CompareEntry => ({ id, title: `Khóa ${id}` })

describe('toggleEntry', () => {
  it('adds, then removes', () => {
    const added = toggleEntry([], e(1))
    expect(added).toMatchObject({ added: true, full: false })
    expect(toggleEntry(added.list, e(1)).list).toEqual([])
  })
  it('refuses a fourth course', () => {
    const result = toggleEntry([e(1), e(2), e(3)], e(4))
    expect(result.full).toBe(true)
    expect(result.list).toHaveLength(3)
  })
})

describe('parseStored', () => {
  it('survives junk', () => {
    expect(parseStored(null)).toEqual([])
    expect(parseStored('nope')).toEqual([])
    expect(parseStored('{"a":1}')).toEqual([])
  })
  it('keeps valid entries once, up to three', () => {
    const raw = JSON.stringify([e(1), e(1), { id: 'x', title: 't' }, e(2), e(3), e(4)])
    expect(parseStored(raw).map(entry => entry.id)).toEqual([1, 2, 3])
  })
})

describe('idsFromQuery', () => {
  it('reads a shared link', () => {
    expect(idsFromQuery('5,3,x,5,9,2')).toEqual([5, 3, 9])
    expect(idsFromQuery(undefined)).toEqual([])
  })
})
