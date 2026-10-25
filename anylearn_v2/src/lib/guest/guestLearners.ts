import { GUEST_PROMPT_PATHS, MAX_GUEST_LEARNERS, MAX_NICKNAME_LENGTH } from '@/config/guestLearners'
import { isDismissedRecently } from '@/lib/pwa/installPrompt'

export type Audience = 'child' | 'self'

export interface GuestLearner {
  localId: string
  nickname: string
  birthYear: number
}

// What a visitor who is not logged in told us about who the courses are for. Lives in localStorage only until the
// visitor registers or logs in.
export interface GuestLearnerStore {
  version: 1
  audience?: Audience
  learners: GuestLearner[]
  selfBirthYear?: number
  selectedLocalId?: string
  dismissedAt?: string
}

export interface ChildRecord {
  id: number
  name: string
  dob?: string | null
}

export const EMPTY_GUEST_STORE: GuestLearnerStore = { version: 1, learners: [] }

const FIRST_BIRTH_YEAR = 1900

function isBirthYear(value: unknown, now: Date): value is number {
  return Number.isInteger(value) && (value as number) >= FIRST_BIRTH_YEAR && (value as number) <= now.getFullYear()
}

function parseLearner(raw: unknown, now: Date): GuestLearner | null {
  if (typeof raw !== 'object' || raw === null) return null
  const { localId, nickname, birthYear } = raw as Record<string, unknown>
  if (typeof localId !== 'string' || !localId) return null
  if (typeof nickname !== 'string' || !nickname.trim()) return null
  if (!isBirthYear(birthYear, now)) return null
  return { localId, nickname: nickname.trim().slice(0, MAX_NICKNAME_LENGTH), birthYear }
}

// Anything unexpected (old version, hand-edited, cut off) reads as "nothing saved" instead of breaking the page.
export function parseGuestLearnerStore(raw: string | null, now = new Date()): GuestLearnerStore {
  if (!raw) return EMPTY_GUEST_STORE
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return EMPTY_GUEST_STORE
  }
  if (typeof data !== 'object' || data === null) return EMPTY_GUEST_STORE
  const stored = data as Record<string, unknown>
  if (stored.version !== 1) return EMPTY_GUEST_STORE

  const rawLearners = Array.isArray(stored.learners) ? stored.learners : []
  const learners = rawLearners
    .map(item => parseLearner(item, now))
    .filter((item): item is GuestLearner => item !== null)
    .slice(0, MAX_GUEST_LEARNERS)
  const selected = typeof stored.selectedLocalId === 'string' && learners.some(item => item.localId === stored.selectedLocalId)
    ? stored.selectedLocalId
    : undefined
  return {
    version: 1,
    audience: stored.audience === 'child' || stored.audience === 'self' ? stored.audience : undefined,
    learners,
    selfBirthYear: isBirthYear(stored.selfBirthYear, now) ? stored.selfBirthYear : undefined,
    selectedLocalId: selected,
    dismissedAt: typeof stored.dismissedAt === 'string' ? stored.dismissedAt : undefined,
  }
}

export function hasGuestLearners(store: GuestLearnerStore): boolean {
  return store.learners.length > 0
}

export function hasGuestAnswer(store: GuestLearnerStore): boolean {
  return store.audience !== undefined
}

// Asked on the first visit to a browse page, then again only after a "Để sau" has aged out.
export function shouldAskWhoFor(store: GuestLearnerStore, pathname: string, now: Date, dismissDays: number): boolean {
  if (!isPromptPath(pathname)) return false
  if (hasGuestAnswer(store)) return false
  return !isDismissedRecently(store.dismissedAt ?? null, now, dismissDays)
}

export function isPromptPath(pathname: string): boolean {
  return GUEST_PROMPT_PATHS.some(path => (path === '/' ? pathname === '/' : pathname.startsWith(path)))
}

export function ageFromBirthYear(birthYear: number, today = new Date()): number {
  return Math.max(0, today.getFullYear() - birthYear)
}

// The search filter has these buckets (config/searchFilters.ts); a toddler uses the youngest one.
export function ageFilterFor(age: number): string {
  if (age <= 5) return '3-5'
  if (age <= 10) return '6-10'
  if (age <= 15) return '11-15'
  return '16+'
}

export function dobFromBirthYear(birthYear: number): string {
  return `${birthYear}-01-01`
}

export function birthYearOfDob(dob?: string | null): number | null {
  const year = Number(dob?.slice(0, 4))
  return Number.isInteger(year) && year > 0 ? year : null
}

// "Bé Bin" and "be  bin" are the same name; "Đức" and "duc" too.
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export interface GuestMatch {
  guest: GuestLearner
  child: ChildRecord
}

export interface GuestMatchResult {
  matched: GuestMatch[]
  unmatched: GuestLearner[]
}

// A guest learner is the same person as an existing child when the name (without accents) is the same: the server
// does not allow two children with one name, so "Bin" typed with another birth year is still that Bin (the year may just
// be a typo, and checkout asks for the exact date anyway). One child answers for one guest only.
export function matchGuestToChildren(guests: GuestLearner[], children: ChildRecord[]): GuestMatchResult {
  const available = [...children]
  const matched: GuestMatch[] = []
  const unmatched: GuestLearner[] = []
  for (const guest of guests) {
    const index = available.findIndex(child => normalizeName(child.name) === normalizeName(guest.nickname))
    const child = index >= 0 ? available.splice(index, 1)[0] : undefined
    if (child) matched.push({ guest, child })
    else unmatched.push(guest)
  }
  return { matched, unmatched }
}

// First name used more than once in a list ("Bin" and "bin "), or null.
export function duplicateNickname(learners: { nickname: string }[]): string | null {
  const seen = new Set<string>()
  for (const learner of learners) {
    const key = normalizeName(learner.nickname)
    if (!key) continue
    if (seen.has(key)) return learner.nickname.trim()
    seen.add(key)
  }
  return null
}

export function selectedGuestLearner(store: GuestLearnerStore): GuestLearner | undefined {
  return store.learners.find(item => item.localId === store.selectedLocalId) ?? store.learners[0]
}

// ── Updates (return a new store) ─────────────────────────────────────────────

export function withAnswer(store: GuestLearnerStore, answer: {
  audience: Audience
  learners: GuestLearner[]
  selfBirthYear?: number
}): GuestLearnerStore {
  const learners = answer.audience === 'child' ? answer.learners.slice(0, MAX_GUEST_LEARNERS) : []
  const selected = learners.some(item => item.localId === store.selectedLocalId) ? store.selectedLocalId : learners[0]?.localId
  return {
    version: 1,
    audience: answer.audience,
    learners,
    selfBirthYear: answer.audience === 'self' ? answer.selfBirthYear : undefined,
    selectedLocalId: selected,
  }
}

export function withDismissed(store: GuestLearnerStore, now: Date): GuestLearnerStore {
  return { ...store, dismissedAt: now.toISOString() }
}

export function withSelected(store: GuestLearnerStore, localId: string): GuestLearnerStore {
  return store.learners.some(item => item.localId === localId) ? { ...store, selectedLocalId: localId } : store
}

export function withoutLearners(store: GuestLearnerStore, localIds: string[]): GuestLearnerStore {
  const learners = store.learners.filter(item => !localIds.includes(item.localId))
  if (learners.length === 0) return EMPTY_GUEST_STORE
  const selected = learners.some(item => item.localId === store.selectedLocalId) ? store.selectedLocalId : learners[0]?.localId
  return { ...store, learners, selectedLocalId: selected }
}

// Who the visitor is shopping for, as chips: each child, or the visitor when they gave a birth year.
export interface GuestPerson {
  key: string
  label: string
  ageFilter: string
  // Set for a child (selecting it is remembered); the visitor themselves has no localId.
  localId?: string
}

export function guestPeople(store: GuestLearnerStore, today = new Date()): GuestPerson[] {
  if (store.audience === 'self' && store.selfBirthYear) {
    const age = ageFromBirthYear(store.selfBirthYear, today)
    return [{ key: 'self', label: `Tôi · ${age}t`, ageFilter: ageFilterFor(age) }]
  }
  return store.learners.map(learner => ({
    key: learner.localId,
    label: describeGuestLearner(learner, today),
    ageFilter: ageFilterFor(ageFromBirthYear(learner.birthYear, today)),
    localId: learner.localId,
  }))
}

export function selectedGuestPerson(store: GuestLearnerStore, today = new Date()): GuestPerson | undefined {
  const people = guestPeople(store, today)
  return people.find(person => person.localId !== undefined && person.localId === store.selectedLocalId) ?? people[0]
}

export function describeGuestLearner(learner: GuestLearner, today = new Date()): string {
  return `${learner.nickname} · ${ageFromBirthYear(learner.birthYear, today)}t`
}

// Years offered in a picker, newest first: this year back to `maxAge` years ago.
export function birthYearOptions(today: Date, minAge: number, maxAge: number): number[] {
  const years: number[] = []
  for (let age = minAge; age <= maxAge; age++) years.push(today.getFullYear() - age)
  return years
}
