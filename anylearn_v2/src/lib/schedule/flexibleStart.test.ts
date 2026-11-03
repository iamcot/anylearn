import { describe, expect, it } from 'vitest'
import { dayMonth, earliestStart, firstClassDay, longDay, resolveStart, suggestedStarts, weekdayShort } from './flexibleStart'

// 2026-11-03 is a Tuesday
const TODAY = '2026-11-03'

describe('flexible start', () => {
  it('suggests the next three class days from today', () => {
    expect(suggestedStarts({ weekdays: 'tue,thu,sat' }, TODAY)).toEqual(['2026-11-03', '2026-11-05', '2026-11-07'])
  })

  it('treats a class without weekdays as meeting every day', () => {
    expect(suggestedStarts({ weekdays: null }, TODAY)).toEqual(['2026-11-03', '2026-11-04', '2026-11-05'])
  })

  it('stops at the class end and waits for its start', () => {
    expect(suggestedStarts({ weekdays: 'sat', dateEnd: '2026-11-10' }, TODAY)).toEqual(['2026-11-07'])
    expect(suggestedStarts({ weekdays: 'mon', dateStart: '2026-12-01' }, TODAY, 1)).toEqual(['2026-12-07'])
  })

  it('moves a custom day to the first class day on or after it', () => {
    expect(resolveStart({ weekdays: 'mon,wed' }, '2026-11-20', TODAY)).toBe('2026-11-23')
    expect(resolveStart({ weekdays: 'mon,wed' }, '2026-11-25', TODAY)).toBe('2026-11-25')
    expect(resolveStart({ weekdays: 'tue,wed' }, '2026-10-01', TODAY)).toBe('2026-11-03')
    expect(resolveStart({ weekdays: 'wed' }, '2026-10-01', TODAY)).toBe('2026-11-04')
    expect(resolveStart({ weekdays: 'mon', dateEnd: '2026-11-30' }, '2026-12-01', TODAY)).toBeNull()
  })

  it('formats days', () => {
    expect(earliestStart('2026-12-31')).toBe('2026-12-31')
    expect(firstClassDay({ weekdays: 'sun' }, '2026-11-03')).toBe('2026-11-08')
    expect(weekdayShort('2026-11-08')).toBe('CN')
    expect(dayMonth('2026-11-05')).toBe('05/11')
    expect(longDay('2026-11-05')).toBe('Thứ 5, 05/11/2026')
  })
})
