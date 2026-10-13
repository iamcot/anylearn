import { describe, expect, it } from 'vitest'
import { hasAnyEnrollment, pickLearnerId, titleFor } from './learners'
import type { LearnersData } from './types'

const learners: LearnersData = {
  defaultLearnerId: 2,
  feeDueTotal: 0,
  learners: [
    { id: 1, name: 'Mẹ', self: true, hasEnrollment: false, feeDueCount: 0 },
    { id: 2, name: 'Bin', self: false, hasEnrollment: true, feeDueCount: 0 },
  ],
}

describe('pickLearnerId', () => {
  it('uses the wanted learner when it belongs to the account', () => expect(pickLearnerId(learners, 1)).toBe(1))
  it('falls back to the default for unknown or missing ids', () => {
    expect(pickLearnerId(learners, 99)).toBe(2)
    expect(pickLearnerId(learners, null)).toBe(2)
  })
})

describe('page text', () => {
  it('detects when nobody has an enrollment', () => {
    expect(hasAnyEnrollment(learners)).toBe(true)
    expect(hasAnyEnrollment({ ...learners, learners: [learners.learners[0]] })).toBe(false)
  })
  it('titles the page for yourself or for a child', () => {
    expect(titleFor(true)).toBe('Hôm nay của bạn')
    expect(titleFor(false)).toBe('Hôm nay của con')
  })
})
