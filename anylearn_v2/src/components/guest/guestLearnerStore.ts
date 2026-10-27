import { GUEST_LEARNERS_KEY, PENDING_CHILD_KEY } from '@/config/guestLearners'
import { EMPTY_GUEST_STORE, parseGuestLearnerStore, type GuestLearnerStore } from '@/lib/guest/guestLearners'

// localStorage-backed store for useSyncExternalStore. When the browser blocks storage (private mode) the answers live
// in memory for this page view, so the question is not asked again on every click.
let memoryStore: GuestLearnerStore | null = null
let cachedRaw: string | null | undefined
let cachedStore: GuestLearnerStore = EMPTY_GUEST_STORE
const subscribers = new Set<() => void>()
let sheetOpen = false
let childrenVersion = 0

function readRaw(): string | null {
  try {
    return localStorage.getItem(GUEST_LEARNERS_KEY)
  } catch {
    return null
  }
}

function notify() {
  subscribers.forEach(callback => callback())
}

export function getGuestStore(): GuestLearnerStore {
  if (memoryStore) return memoryStore
  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedStore = parseGuestLearnerStore(raw)
  }
  return cachedStore
}

export function saveGuestStore(next: GuestLearnerStore) {
  try {
    if (next === EMPTY_GUEST_STORE || (next.learners.length === 0 && !next.audience && !next.dismissedAt && !next.interests)) {
      localStorage.removeItem(GUEST_LEARNERS_KEY)
    } else {
      localStorage.setItem(GUEST_LEARNERS_KEY, JSON.stringify(next))
    }
    memoryStore = null
  } catch {
    memoryStore = next
  }
  cachedRaw = undefined
  notify()
}

export function subscribeGuestStore(callback: () => void) {
  subscribers.add(callback)
  window.addEventListener('storage', callback)
  return () => {
    subscribers.delete(callback)
    window.removeEventListener('storage', callback)
  }
}

// The sheet can be opened from anywhere ("Sửa" on the search chips, the course page).
export function openGuestSheet() {
  sheetOpen = true
  notify()
}

export function closeGuestSheet() {
  sheetOpen = false
  notify()
}

export function isGuestSheetOpen(): boolean {
  return sheetOpen
}

// Bumped when children were added to (or matched on) the logged-in account, so a page that is already open
// (add2cart) reloads its list instead of waiting for F5.
export function notifyChildrenChanged() {
  childrenVersion++
  notify()
}

export function getChildrenVersion(): number {
  return childrenVersion
}

// The child that register/login created or matched, picked on /add2cart.
export function setPendingChildId(childId: number) {
  try {
    localStorage.setItem(PENDING_CHILD_KEY, String(childId))
  } catch {}
}

export function takePendingChildId(): number | null {
  try {
    const value = Number(localStorage.getItem(PENDING_CHILD_KEY))
    localStorage.removeItem(PENDING_CHILD_KEY)
    return value > 0 ? value : null
  } catch {
    return null
  }
}
