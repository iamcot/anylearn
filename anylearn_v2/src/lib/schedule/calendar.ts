const WEEKDAY_INDEX: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 }
const FALLBACK_COURSE_YEARS = 1

export interface Enrollment {
  id: number
  itemId: number
  itemTitle: string
  seoUrl?: string
  scheduleType: string
  weekdays?: string
  timeStart?: string
  timeEnd?: string
  dateStart?: string
  dateEnd?: string
  eventDate?: string
  startDate?: string
  endDate?: string
  scheduleTitle?: string
  locationNote?: string
  status: string
  cycleType?: string
  cycleAmount?: number
}

export interface Activity {
  id: number
  itemId: number
  itemTitle: string
  seoUrl?: string
  type: string
  date?: string
  note?: string
  status: number
}

export type CalendarEvent = { kind: 'enrollment'; data: Enrollment } | { kind: 'activity'; data: Activity }

// The API sends snake_case fields.
export interface RawEnrollment {
  id: number; item_id: number; item_title?: string; seo_url?: string
  schedule_type?: string; weekdays?: string; time_start?: string; time_end?: string
  date_start?: string; date_end?: string; event_date?: string; start_date?: string; end_date?: string
  schedule_title?: string; location_note?: string; status: string
  cycle_type?: string; cycle_amount?: number | string | null
}

export interface RawActivity {
  id: number; item_id: number; item_title?: string; seo_url?: string
  type?: string; date?: string; note?: string; status: number | string
}

export function normalizeEnrollment(raw: RawEnrollment): Enrollment {
  return {
    id: raw.id,
    itemId: raw.item_id,
    itemTitle: raw.item_title ?? '',
    seoUrl: raw.seo_url,
    scheduleType: raw.schedule_type ?? '',
    weekdays: raw.weekdays,
    timeStart: raw.time_start,
    timeEnd: raw.time_end,
    dateStart: raw.date_start,
    dateEnd: raw.date_end,
    eventDate: raw.event_date,
    startDate: raw.start_date,
    endDate: raw.end_date,
    scheduleTitle: raw.schedule_title,
    locationNote: raw.location_note,
    status: raw.status,
    cycleType: raw.cycle_type,
    cycleAmount: raw.cycle_amount != null ? Number(raw.cycle_amount) : undefined,
  }
}

export function normalizeActivity(raw: RawActivity): Activity {
  return {
    id: raw.id,
    itemId: raw.item_id,
    itemTitle: raw.item_title ?? '',
    seoUrl: raw.seo_url,
    type: raw.type ?? '',
    date: raw.date,
    note: raw.note,
    status: Number(raw.status),
  }
}

export function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function mondayOfWeek(date: Date): Date {
  const dayOfWeek = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek))
  return monday
}

export function weekRange(date: Date): { from: string; to: string } {
  const monday = mondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: toISO(monday), to: toISO(sunday) }
}

export function monthRange(date: Date): { from: string; to: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  return { from: toISO(new Date(year, month, 1)), to: toISO(new Date(year, month + 1, 0)) }
}

function weekdayIndexes(weekdays?: string): number[] {
  return (weekdays ?? '')
    .split(',')
    .map(day => WEEKDAY_INDEX[day.trim()])
    .filter((index): index is number => index !== undefined)
}

function addCycle(start: Date, cycleType: string, amount: number): Date | null {
  const end = new Date(start)
  if (cycleType === 'year') end.setFullYear(end.getFullYear() + amount)
  else if (cycleType === 'month') end.setMonth(end.getMonth() + amount)
  else if (cycleType === 'week') end.setDate(end.getDate() + amount * 7)
  else if (cycleType === 'day') end.setDate(end.getDate() + amount)
  else return null
  end.setDate(end.getDate() - 1)
  return end
}

function lastSessionDate(start: Date, weekdays: number[], sessions: number): Date {
  const date = new Date(start)
  const days = new Set(weekdays)
  let count = 0
  while (count < sessions) {
    if (days.has(date.getDay())) count++
    if (count < sessions) date.setDate(date.getDate() + 1)
  }
  return date
}

export function computeEffectiveEnd(enrollment: Enrollment): string | null {
  if (enrollment.endDate) return enrollment.endDate.substring(0, 10)
  const startText = enrollment.startDate ?? enrollment.dateStart
  if (!startText) return null
  const start = new Date(`${startText.substring(0, 10)}T00:00:00`)

  const { cycleType, cycleAmount } = enrollment
  if (cycleType && cycleAmount) {
    if (cycleType === 'session' && enrollment.weekdays) {
      return toISO(lastSessionDate(start, weekdayIndexes(enrollment.weekdays), cycleAmount))
    }
    const end = addCycle(start, cycleType, cycleAmount)
    return end ? toISO(end) : null
  }

  const cap = new Date(start)
  cap.setFullYear(cap.getFullYear() + FALLBACK_COURSE_YEARS)
  return toISO(cap)
}

function isWithinCourse(enrollment: Enrollment, iso: string, startText: string | undefined): boolean {
  if (startText && iso < startText.substring(0, 10)) return false
  const end = computeEffectiveEnd(enrollment)
  return !(end && iso > end)
}

export function enrollmentsOnDate(enrollments: Enrollment[], iso: string): Enrollment[] {
  const dayOfWeek = new Date(`${iso}T00:00:00`).getDay()
  return enrollments.filter(enrollment => {
    if (enrollment.status !== 'active') return false
    if (enrollment.scheduleType === 'event') return enrollment.eventDate?.substring(0, 10) === iso
    // Billing-only courses have no schedule type: every day in the paid range counts.
    if (!enrollment.scheduleType) return !!enrollment.startDate && isWithinCourse(enrollment, iso, enrollment.startDate)
    if (!weekdayIndexes(enrollment.weekdays).includes(dayOfWeek)) return false
    return isWithinCourse(enrollment, iso, enrollment.startDate ?? enrollment.dateStart)
  })
}

export function activitiesOnDate(activities: Activity[], iso: string): Activity[] {
  return activities.filter(activity => activity.date === iso && activity.status >= 0)
}

export function eventsOnDate(enrollments: Enrollment[], activities: Activity[], iso: string): CalendarEvent[] {
  return [
    ...enrollmentsOnDate(enrollments, iso).map(data => ({ kind: 'enrollment' as const, data })),
    ...activitiesOnDate(activities, iso).map(data => ({ kind: 'activity' as const, data })),
  ]
}
