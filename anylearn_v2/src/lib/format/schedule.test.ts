import { describe, expect, it } from 'vitest'
import { formatSchedule } from './schedule'

const BASE = { id: 1, scheduleType: 'recurring' }

describe('formatSchedule', () => {
  it('joins weekdays, time range and start date', () => {
    expect(formatSchedule({ ...BASE, weekdays: 'tue,thu', timeStart: '18:00', timeEnd: '19:30', dateStart: '2026-11-03T00:00:00' }))
      .toBe('Thứ Ba Thứ Năm · 18:00–19:30 · từ 3/11/2026')
  })

  it('keeps unknown weekday codes and a start time without an end', () => {
    expect(formatSchedule({ ...BASE, weekdays: 'xyz', timeStart: '09:00' })).toBe('xyz · 09:00')
  })

  it('formats a one-off event with weekday and date', () => {
    expect(formatSchedule({ id: 2, scheduleType: 'event', eventDate: '2026-11-01T00:00:00', timeStart: '09:00' }))
      .toBe('Chủ Nhật, 01/11/2026 · 09:00')
  })

  it('returns an empty string when there is nothing to show', () => {
    expect(formatSchedule(BASE)).toBe('')
  })
})
