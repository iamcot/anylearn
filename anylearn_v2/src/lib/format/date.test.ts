import { describe, expect, it } from 'vitest'
import { formatDate, formatRelativeDay, toIsoDate } from './date'

const NOW = new Date(2026, 9, 25, 9, 0)

describe('toIsoDate', () => {
  it('pads month and day', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('formatDate', () => {
  it('returns an empty string for missing or invalid input', () => {
    expect(formatDate()).toBe('')
    expect(formatDate('not a date')).toBe('')
  })

  it('formats as dd/mm/yyyy', () => {
    expect(formatDate('2026-07-01T00:00:00')).toBe('01/07/2026')
  })
})

describe('formatRelativeDay', () => {
  it('names today and tomorrow', () => {
    expect(formatRelativeDay('2026-10-25', NOW)).toBe('Hôm nay')
    expect(formatRelativeDay('2026-10-26', NOW)).toBe('Ngày mai')
  })

  it('shows weekday and day/month for other days', () => {
    expect(formatRelativeDay('2026-10-30', NOW)).toContain('30/10')
  })
})
