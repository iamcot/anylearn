export interface PointExpiryPolicy {
  enabled: boolean
  months: number
  /** First day the rule counts from (yyyy-MM-dd). */
  startDate: string
  /** The day the earliest points are removed, and the last day they can still be used. */
  firstExpiryDay: string
  firstLastUsableDay: string
}

export interface PointExpiryRow { lastUsableDay: string; points: number }

export interface MyPointExpiry extends PointExpiryPolicy {
  /** True for a member while the rule is on; partners' points never expire. */
  applies: boolean
  schedule: PointExpiryRow[]
  next: PointExpiryRow | null
}

/** "2027-12-31" to "31/12/2027" without going through a time zone. */
export function formatIsoDay(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

/** The one line under the balance, or null when nothing expires. */
export function expiryLine(expiry: MyPointExpiry | null): string | null {
  if (!expiry || !expiry.applies || !expiry.next) return null
  return `${expiry.next.points.toLocaleString('vi-VN')} anyPoint dùng được đến hết ngày ${formatIsoDay(expiry.next.lastUsableDay)}`
}

/** True when the rule has not started yet (the page tells people nothing is lost before that day). */
export function hasNotStarted(policy: PointExpiryPolicy, today: Date = new Date()): boolean {
  const [year, month, day] = policy.startDate.split('-').map(Number)
  return today < new Date(year, month - 1, day)
}
