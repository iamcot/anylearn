import { describe, expect, it } from 'vitest'
import { EMPTY_SELECTION, buildActivityPayload, hasChosenActivity, type ActivitySelection } from './activities'

const ALL_ENABLED = { trial: true, test: true, visit: true }

describe('buildActivityPayload', () => {
  it('returns nothing when no activity is chosen', () => {
    expect(buildActivityPayload(EMPTY_SELECTION, ALL_ENABLED)).toEqual([])
  })

  it('keeps chosen activities in a fixed order and drops empty date and note', () => {
    const selection: ActivitySelection = {
      ...EMPTY_SELECTION,
      visit: { checked: true, date: '', note: '' },
      trial: { checked: true, date: '2026-11-05', note: 'sáng thứ bảy' },
    }
    expect(buildActivityPayload(selection, ALL_ENABLED)).toEqual([
      { type: 'trial', date: '2026-11-05', note: 'sáng thứ bảy' },
      { type: 'visit', date: undefined, note: undefined },
    ])
  })

  it('ignores activities the course does not offer', () => {
    const selection: ActivitySelection = { ...EMPTY_SELECTION, test: { checked: true, date: '', note: '' } }
    expect(buildActivityPayload(selection, { ...ALL_ENABLED, test: false })).toEqual([])
  })
})

describe('hasChosenActivity', () => {
  it('is true only for an offered and checked activity', () => {
    const selection: ActivitySelection = { ...EMPTY_SELECTION, test: { checked: true, date: '', note: '' } }
    expect(hasChosenActivity(selection, ALL_ENABLED)).toBe(true)
    expect(hasChosenActivity(selection, { ...ALL_ENABLED, test: false })).toBe(false)
    expect(hasChosenActivity(EMPTY_SELECTION, ALL_ENABLED)).toBe(false)
  })
})
