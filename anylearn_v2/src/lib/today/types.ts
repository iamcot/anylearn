export type SessionMode = 'online' | 'onsite' | 'extra'
export type FeeState = 'HIDDEN' | 'DUE_SOON' | 'OVERDUE' | 'AWAITING_CONFIRMATION'
export type RequestType = 'leave' | 'reschedule' | 'makeup'

export interface LocationView {
  name: string | null
  address: string | null
  roomNote: string | null
  latitude: number | null
  longitude: number | null
}

export interface SessionView {
  key: string
  itemId: number
  title: string
  mode: SessionMode
  startAt: string
  endAt: string
  teacherName: string | null
  attended: boolean
  pendingRequest: RequestType | null
  joinOpensAt: string | null
  canJoin: boolean
  location: LocationView | null
  gatherTime: string | null
  bringItems: string | null
}

export interface FeeView {
  itemId: number
  itemTitle: string
  state: FeeState
  paidUntil: string | null
  paidUntilText: string | null
  paidPeriodLabel: string | null
  nextStart: string | null
  nextPeriodLabel: string
  amount: number
}

export interface PackageView {
  enrollmentId: number
  itemId: number
  title: string
  used: number
  total: number
  remaining: number
  endDate: string | null
  showRenew: boolean
}

export interface WeekDayView {
  date: string
  hasClass: boolean
  hasExtra: boolean
  sessions: SessionView[]
}

export interface Learner {
  id: number
  name: string
  self: boolean
}

export interface TodayData {
  learner: Learner
  nextSession: SessionView | null
  freeToday: boolean
  laterToday: SessionView[]
  extraSessions: SessionView[]
  fees: FeeView[]
  week: WeekDayView[]
  packages: PackageView[]
}

export interface LearnerView extends Learner {
  hasEnrollment: boolean
  feeDueCount: number
}

export interface LearnersData {
  learners: LearnerView[]
  defaultLearnerId: number
  feeDueTotal: number
}

export interface JoinData {
  url: string
  meetingId: string | null
  passcode: string | null
}

/** A session that ended in the last 30 days with no attendance and no approved leave. */
export interface MissedSession {
  sessionKey: string
  learnerId: number
  itemTitle: string
  date: string
  start: string | null
}

export interface MissedAttendance {
  total: number
  items: MissedSession[]
}
