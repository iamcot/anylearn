import { describe, expect, it } from 'vitest'
import { guestAutoAge } from './autoAge'
import type { GuestLearnerStore } from './guestLearners'

const TODAY = new Date(2026, 9, 25)
const STORE: GuestLearnerStore = {
  version: 1, audience: 'child', selectedLocalId: 'b',
  learners: [{ localId: 'a', nickname: 'Bin', birthYear: 2015 }, { localId: 'b', nickname: 'Su', birthYear: 2017 }],
}

function input(overrides: Partial<Parameters<typeof guestAutoAge>[0]> = {}) {
  return { store: STORE, activeAge: 'all', alreadyApplied: false, loggedIn: false, today: TODAY, ...overrides }
}

describe('guestAutoAge', () => {
  it('filters by the age of the child the visitor chose', () => {
    expect(guestAutoAge(input())).toBe('6-10')
  })

  it('does nothing when an age is already in the search', () => {
    expect(guestAutoAge(input({ activeAge: '11-15' }))).toBeNull()
  })

  it('only happens once per tab', () => {
    expect(guestAutoAge(input({ alreadyApplied: true }))).toBeNull()
  })

  it('is for visitors without an account only', () => {
    expect(guestAutoAge(input({ loggedIn: true }))).toBeNull()
  })

  it('does nothing without an answer', () => {
    expect(guestAutoAge(input({ store: { version: 1, learners: [] } }))).toBeNull()
  })
})
