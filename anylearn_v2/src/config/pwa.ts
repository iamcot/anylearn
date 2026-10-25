// After "Để sau" the install card stays hidden for this many days.
export const INSTALL_DISMISS_DAYS = 14

// /today shows the install card from this visit on (first visit is about the schedule, not the app).
export const INSTALL_MIN_TODAY_VISITS = 2

export const INSTALL_DISMISSED_KEY = 'anylearn.installDismissedAt'
export const TODAY_VISITS_KEY = 'anylearn.todayVisits'
export const TODAY_VISIT_COUNTED_KEY = 'anylearn.todayVisitCounted'

// After "Để sau" on the notification card it stays hidden for this many days.
export const PUSH_DISMISS_DAYS = 7

export const PUSH_DISMISSED_KEY = 'anylearn.pushDismissedAt'
// Set when the person turns notifications off for this device, so the login sync does not turn them back on.
export const PUSH_OPT_OUT_KEY = 'anylearn.pushOptOut'
// Id of the account this browser's subscription was last sent for.
export const PUSH_SYNCED_KEY = 'anylearn.pushSyncedUser'

// Subscribing waits on the browser's push service (Google, Apple, Mozilla); give up instead of a button stuck on "Đang bật...".
export const PUSH_SUBSCRIBE_TIMEOUT_MS = 20_000
