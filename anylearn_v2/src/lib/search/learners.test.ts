import { describe, expect, it } from 'vitest'
import { ageRangeOf, learnerChips } from './learners'

const TODAY = new Date('2026-10-26T10:00:00')

describe('ageRangeOf', () => {
  it('uses completed years for a full date', () => {
    expect(ageRangeOf('2011-10-27', false, TODAY)).toEqual({ from: 14, to: 14 })
    expect(ageRangeOf('2011-10-26', false, TODAY)).toEqual({ from: 15, to: 15 })
  })

  it('gives two possible ages for a birth year only', () => {
    expect(ageRangeOf('2017-01-01', true, TODAY)).toEqual({ from: 8, to: 9 })
  })

  it('returns null without a usable date', () => {
    expect(ageRangeOf(null, false, TODAY)).toBeNull()
    expect(ageRangeOf('abc', false, TODAY)).toBeNull()
  })
})

describe('learnerChips', () => {
  it('lists children then the owner and skips people without a date', () => {
    const chips = learnerChips(
      [{ id: 1, name: 'Bin', dob: '2011-03-01' }, { id: 2, name: 'Su', dob: '2017-01-01', dobYearOnly: true }, { id: 3, name: 'Gà' }],
      { name: 'Mẹ', dob: '1988-05-05' },
      TODAY,
    )
    expect(chips).toEqual([
      { key: 'c1', name: 'Bin', label: 'Bin 15t', ageFrom: 15, ageTo: 15 },
      { key: 'c2', name: 'Su', label: 'Su 9t', ageFrom: 8, ageTo: 9 },
      { key: 'self', name: 'Tôi', label: 'Tôi · 38t', ageFrom: 38, ageTo: 38 },
    ])
  })
})
