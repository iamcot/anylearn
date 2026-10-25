import { describe, expect, it } from 'vitest'
import {
  activitiesOnDate, computeEffectiveEnd, enrollmentsOnDate, eventsOnDate, monthRange, mondayOfWeek,
  normalizeEnrollment, toISO, weekRange, type Activity, type Enrollment,
} from './calendar'

const BASE: Enrollment = { id: 1, itemId: 10, itemTitle: 'Piano', scheduleType: 'recurring', status: 'active' }

describe('date helpers', () => {
  it('formats local dates as yyyy-mm-dd', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('finds the Monday of a week, also when the date is a Sunday', () => {
    expect(toISO(mondayOfWeek(new Date(2026, 9, 25)))).toBe('2026-10-19') // Sunday
    expect(toISO(mondayOfWeek(new Date(2026, 9, 21)))).toBe('2026-10-19') // Wednesday
  })

  it('builds week and month ranges', () => {
    expect(weekRange(new Date(2026, 9, 21))).toEqual({ from: '2026-10-19', to: '2026-10-25' })
    expect(monthRange(new Date(2026, 1, 10))).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })
})

describe('computeEffectiveEnd', () => {
  it('prefers an explicit end date', () => {
    expect(computeEffectiveEnd({ ...BASE, startDate: '2026-01-01', endDate: '2026-03-15T00:00:00' })).toBe('2026-03-15')
  })

  it('adds a month cycle and stops the day before', () => {
    expect(computeEffectiveEnd({ ...BASE, startDate: '2026-01-15', cycleType: 'month', cycleAmount: 3 })).toBe('2026-04-14')
  })

  it('counts sessions on the weekdays of the schedule', () => {
    // Tuesdays and Thursdays from Tue 2026-11-03: 4 sessions -> Tue 3, Thu 5, Tue 10, Thu 12
    expect(computeEffectiveEnd({ ...BASE, startDate: '2026-11-03', weekdays: 'tue,thu', cycleType: 'session', cycleAmount: 4 })).toBe('2026-11-12')
  })

  it('caps at one year without a cycle, and returns null without a start', () => {
    expect(computeEffectiveEnd({ ...BASE, startDate: '2026-01-01' })).toBe('2027-01-01')
    expect(computeEffectiveEnd(BASE)).toBeNull()
  })

  it('returns null for an unknown cycle type', () => {
    expect(computeEffectiveEnd({ ...BASE, startDate: '2026-01-01', cycleType: 'decade', cycleAmount: 1 })).toBeNull()
  })
})

describe('enrollmentsOnDate', () => {
  const weekly: Enrollment = { ...BASE, weekdays: 'tue,thu', startDate: '2026-11-03', cycleType: 'month', cycleAmount: 1 }

  it('matches the weekdays inside the course range only', () => {
    expect(enrollmentsOnDate([weekly], '2026-11-03')).toHaveLength(1) // Tue
    expect(enrollmentsOnDate([weekly], '2026-11-04')).toHaveLength(0) // Wed
    expect(enrollmentsOnDate([weekly], '2026-10-27')).toHaveLength(0) // Tue before start
    expect(enrollmentsOnDate([weekly], '2026-12-08')).toHaveLength(0) // Tue after the month cycle
  })

  it('ignores enrollments that are not active', () => {
    expect(enrollmentsOnDate([{ ...weekly, status: 'pending' }], '2026-11-03')).toHaveLength(0)
  })

  it('matches a one-off event on its date', () => {
    const event: Enrollment = { ...BASE, scheduleType: 'event', eventDate: '2026-11-01T00:00:00' }
    expect(enrollmentsOnDate([event], '2026-11-01')).toHaveLength(1)
    expect(enrollmentsOnDate([event], '2026-11-02')).toHaveLength(0)
  })

  it('treats a billing-only course as present on every day of its paid range', () => {
    const billing: Enrollment = { ...BASE, scheduleType: '', startDate: '2026-11-01', cycleType: 'month', cycleAmount: 1 }
    expect(enrollmentsOnDate([billing], '2026-11-20')).toHaveLength(1)
    expect(enrollmentsOnDate([billing], '2026-12-01')).toHaveLength(0)
    expect(enrollmentsOnDate([{ ...billing, startDate: undefined }], '2026-11-20')).toHaveLength(0)
  })
})

describe('activities and combined events', () => {
  const activities: Activity[] = [
    { id: 1, itemId: 10, itemTitle: 'Piano', type: 'trial', date: '2026-11-05', status: 0 },
    { id: 2, itemId: 10, itemTitle: 'Piano', type: 'visit', date: '2026-11-05', status: -1 },
  ]

  it('hides cancelled activities', () => {
    expect(activitiesOnDate(activities, '2026-11-05').map(a => a.id)).toEqual([1])
  })

  it('lists classes before activities', () => {
    const weekly: Enrollment = { ...BASE, weekdays: 'thu', startDate: '2026-11-03' }
    expect(eventsOnDate([weekly], activities, '2026-11-05').map(e => e.kind)).toEqual(['enrollment', 'activity'])
  })
})

describe('normalizeEnrollment', () => {
  it('maps snake_case fields and converts the cycle amount to a number', () => {
    const e = normalizeEnrollment({ id: 1, item_id: 2, schedule_type: 'recurring', status: 'active', cycle_amount: '3', time_start: '18:00' })
    expect(e).toMatchObject({ itemId: 2, scheduleType: 'recurring', cycleAmount: 3, timeStart: '18:00', itemTitle: '' })
  })
})
