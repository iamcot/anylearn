import { ageFromBirthYear } from '@/lib/guest/guestLearners'

// A person the courses can be for: one chip, one age range for the search.
export interface LearnerChip {
  key: string
  // "Bin", or "Tôi" for the account owner
  name: string
  label: string
  ageFrom: number
  ageTo: number
}

export interface LearnerSource {
  id?: number
  name: string
  dob?: string | null
  dobYearOnly?: boolean | null
}

function parseDob(dob?: string | null): Date | null {
  if (!dob) return null
  const date = new Date(`${dob.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function completedYears(dob: Date, today: Date): number {
  const birthdayPassed = today.getMonth() > dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate())
  return today.getFullYear() - dob.getFullYear() - (birthdayPassed ? 0 : 1)
}

// Same rule as the server (LearnerDob.ageBounds): with a birth year only, the age is one of two values.
export function ageRangeOf(dobText: string | null | undefined, yearOnly: boolean, today = new Date()): { from: number; to: number } | null {
  const dob = parseDob(dobText)
  if (!dob) return null
  if (yearOnly) {
    const age = ageFromBirthYear(dob.getFullYear(), today)
    return { from: Math.max(0, age - 1), to: age }
  }
  const age = Math.max(0, completedYears(dob, today))
  return { from: age, to: age }
}

function labelOf(name: string, range: { from: number; to: number }): string {
  return `${name} ${range.to}t`
}

// Children first, then the account owner ("Tôi") when they gave a date of birth. People without any date are left out:
// the list cannot be filtered for them.
export function learnerChips(children: LearnerSource[], self: LearnerSource | null, today = new Date()): LearnerChip[] {
  const chips: LearnerChip[] = []
  for (const child of children) {
    const range = ageRangeOf(child.dob, !!child.dobYearOnly, today)
    if (range && child.id !== undefined) chips.push({ key: `c${child.id}`, name: child.name, label: labelOf(child.name, range), ageFrom: range.from, ageTo: range.to })
  }
  const selfRange = self ? ageRangeOf(self.dob, !!self.dobYearOnly, today) : null
  if (selfRange) chips.push({ key: 'self', name: 'Tôi', label: `Tôi · ${selfRange.to}t`, ageFrom: selfRange.from, ageTo: selfRange.to })
  return chips
}

export const ALL_LEARNERS = 'all'
const CHANGE_EVENT = 'anylearn:activeLearner'
const STORAGE_KEY = 'anylearn.activeLearner'

// The chip a person chose last, so the lists open for the same child next time ('all' = no filter).
export function readActiveLearner(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeActiveLearner(key: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, key)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    // private mode: the choice just is not remembered
  }
}

// For useSyncExternalStore: the home page blocks follow the chip when it is changed on the page or in another tab.
export function subscribeActiveLearner(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}
