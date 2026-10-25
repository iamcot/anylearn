import { selectedGuestPerson, type GuestLearnerStore } from './guestLearners'

// A visitor who told us who the courses are for gets the search opened already filtered to that age, once per tab.
// Returns the age bucket to apply, or null when nothing should change.
export function guestAutoAge(input: {
  store: GuestLearnerStore
  activeAge: string
  alreadyApplied: boolean
  loggedIn: boolean
  today?: Date
}): string | null {
  if (input.loggedIn || input.alreadyApplied || input.activeAge !== 'all') return null
  return selectedGuestPerson(input.store, input.today)?.ageFilter ?? null
}
