import { parseStoredUser, readStoredUserRaw } from '@/lib/auth/userStore'
import { guestAutoAge } from '@/lib/guest/autoAge'
import { getGuestStore } from './guestLearnerStore'

const AGE_APPLIED_KEY = 'anylearn.guestAgeApplied'

function alreadyApplied(): boolean {
  try {
    return sessionStorage.getItem(AGE_APPLIED_KEY) === '1'
  } catch {
    return true
  }
}

// Browser only. Returns the age bucket the search should open with and remembers it was used, so the visitor can clear it.
export function takeGuestAutoAge(activeAge: string): string | null {
  const age = guestAutoAge({
    store: getGuestStore(),
    activeAge,
    alreadyApplied: alreadyApplied(),
    loggedIn: parseStoredUser(readStoredUserRaw()) !== null,
  })
  if (!age) return null
  try {
    sessionStorage.setItem(AGE_APPLIED_KEY, '1')
  } catch {}
  return age
}
