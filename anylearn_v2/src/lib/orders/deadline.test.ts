import { describe, expect, it } from 'vitest'
import { formatHoldUntil } from './deadline'

describe('formatHoldUntil', () => {
  it('formats the deadline as hour:minute and day/month', () => {
    expect(formatHoldUntil('2026-10-28T21:30:15.123')).toBe('21:30 ngày 28/10')
  })

  it('returns null without a usable value', () => {
    expect(formatHoldUntil(undefined)).toBeNull()
    expect(formatHoldUntil('soon')).toBeNull()
  })
})
