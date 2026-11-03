// Start day of a flexible ("open", "Linh hoạt") class: the FE copy of the backend FlexibleStartRules (keep in step).
// The parent picks one of the next class days, or any day: the class then starts on the first class day on or after it.

const WEEKDAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const SEARCH_DAYS = 14
export const SUGGESTED_STARTS = 3

export interface FlexibleClass {
  weekdays?: string | null
  dateStart?: string | null
  dateEnd?: string | null
}

const SHORT_WEEKDAY: Record<string, string> = { sun: 'CN', mon: 'Thứ 2', tue: 'Thứ 3', wed: 'Thứ 4', thu: 'Thứ 5', fri: 'Thứ 6', sat: 'Thứ 7' }

function parse(iso: string): Date {
  const [year, month, day] = iso.substring(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function iso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(day: string, days: number): string {
  const date = parse(day)
  date.setDate(date.getDate() + days)
  return iso(date)
}

function classDays(schedule: FlexibleClass): Set<string> {
  return new Set((schedule.weekdays ?? '').split(',').map(code => code.trim().toLowerCase()).filter(code => WEEKDAY_CODES.includes(code)))
}

/** The first day a class may start: tomorrow (the order is paid and the partner told first). */
export function earliestStart(today: string): string {
  return addDays(today, 1)
}

/** First class day on or after `from` (not before the class's own start, null after its end). */
export function firstClassDay(schedule: FlexibleClass, from: string): string | null {
  const days = classDays(schedule)
  let day = schedule.dateStart && schedule.dateStart.substring(0, 10) > from ? schedule.dateStart.substring(0, 10) : from
  const limit = addDays(day, days.size === 0 ? 0 : SEARCH_DAYS)
  const end = schedule.dateEnd ? schedule.dateEnd.substring(0, 10) : null
  for (; day <= limit; day = addDays(day, 1)) {
    if (end && day > end) return null
    if (days.size === 0 || days.has(WEEKDAY_CODES[parse(day).getDay()])) return day
  }
  return null
}

/** The start of a picked day: the first class day on or after it, never before tomorrow. */
export function resolveStart(schedule: FlexibleClass, picked: string, today: string): string | null {
  const earliest = earliestStart(today)
  return firstClassDay(schedule, picked && picked >= earliest ? picked : earliest)
}

/** The next class days from tomorrow (fewer when the class ends sooner). */
export function suggestedStarts(schedule: FlexibleClass, today: string, count = SUGGESTED_STARTS): string[] {
  const out: string[] = []
  let from = earliestStart(today)
  while (out.length < count) {
    const next = firstClassDay(schedule, from)
    if (!next) break
    out.push(next)
    from = addDays(next, 1)
  }
  return out
}

/** "Thứ 5" / "CN" of a day. */
export function weekdayShort(day: string): string {
  return SHORT_WEEKDAY[WEEKDAY_CODES[parse(day).getDay()]]
}

/** "05/11" of a day. */
export function dayMonth(day: string): string {
  const date = parse(day)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** "Thứ 5, 05/11/2026" of a day. */
export function longDay(day: string): string {
  return `${weekdayShort(day)}, ${dayMonth(day)}/${parse(day).getFullYear()}`
}

export function todayIso(now = new Date()): string {
  return iso(now)
}
