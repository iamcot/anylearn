import { API_BASE } from '@/lib/apiBase'
import { parseStoredUser, readStoredUserRaw } from '@/lib/auth/userStore'
import { ageFromBirthYear, selectedGuestLearner } from '@/lib/guest/guestLearners'
import { randomId, type SearchTracking } from '@/lib/search/searchTracking'
import { getGuestStore } from '@/components/guest/guestLearnerStore'

const SESSION_KEY_STORAGE = 'anylearn.sessionKey'
let memorySessionKey: string | null = null
let lastRef: string | null = null

// Random id of this browser, kept so one visitor's searches can be told apart from another's.
function sessionKey(): string {
  try {
    const stored = localStorage.getItem(SESSION_KEY_STORAGE)
    if (stored) return stored
    const created = randomId(Math.random, 24)
    localStorage.setItem(SESSION_KEY_STORAGE, created)
    return created
  } catch {
    memorySessionKey ??= randomId(Math.random, 24)
    return memorySessionKey
  }
}

// Called once per search request, in the browser only. Who the visitor says the courses are for comes from the guest answer.
export function createSearchTracking(): SearchTracking {
  const store = getGuestStore()
  const learner = store.audience === 'child' ? selectedGuestLearner(store) : undefined
  const selfAge = store.audience === 'self' && store.selfBirthYear ? ageFromBirthYear(store.selfBirthYear) : undefined
  const tracking: SearchTracking = {
    ref: randomId(),
    sessionKey: sessionKey(),
    audience: store.audience,
    learnerAge: learner ? ageFromBirthYear(learner.birthYear) : selfAge,
    token: parseStoredUser(readStoredUserRaw())?.jwtToken,
  }
  lastRef = tracking.ref
  return tracking
}

export function currentSearchRef(): string | null {
  return lastRef
}

// A tap on a result: tells the server which search it came from. Never blocks or breaks the navigation.
export function trackSearchClick(itemId: number) {
  if (!lastRef) return
  fetch(`${API_BASE}/search/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: lastRef, itemId }),
    keepalive: true,
  }).catch(() => {})
}
