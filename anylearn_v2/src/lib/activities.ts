export type ActivityType = 'trial' | 'test' | 'visit'

export interface ActivityChoice {
  checked: boolean
  date: string
  note: string
}

export type ActivitySelection = Record<ActivityType, ActivityChoice>

export interface ActivityPayload {
  type: ActivityType
  date?: string
  note?: string
}

export const ACTIVITY_TYPES: ActivityType[] = ['trial', 'test', 'visit']

export const EMPTY_CHOICE: ActivityChoice = { checked: false, date: '', note: '' }

export const EMPTY_SELECTION: ActivitySelection = {
  trial: EMPTY_CHOICE,
  test: EMPTY_CHOICE,
  visit: EMPTY_CHOICE,
}

export function hasChosenActivity(selection: ActivitySelection, enabled: Record<ActivityType, boolean>): boolean {
  return ACTIVITY_TYPES.some(type => enabled[type] && selection[type].checked)
}

export function buildActivityPayload(selection: ActivitySelection, enabled: Record<ActivityType, boolean>): ActivityPayload[] {
  return ACTIVITY_TYPES
    .filter(type => enabled[type] && selection[type].checked)
    .map(type => ({
      type,
      date: selection[type].date || undefined,
      note: selection[type].note || undefined,
    }))
}
