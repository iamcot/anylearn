import { describe, expect, it } from 'vitest'
import type { CartItem } from '@/lib/api'
import { checkFullDob, learnersMissingFullDob, nextLearnerMessage } from './learnerDob'

const TODAY = new Date(2026, 9, 25, 10)

function line(overrides: Partial<CartItem>): CartItem {
  return { cartItemId: 1, itemId: 5, title: 'Bóng đá', price: 1_500_000, ...overrides }
}

describe('learnersMissingFullDob', () => {
  it('lists a child whose date of birth is incomplete', () => {
    const result = learnersMissingFullDob([
      line({ studentId: 11, learnerId: 11, learnerName: 'Bin', dobComplete: false, learnerDobYear: 2015 }),
    ])
    expect(result).toEqual([{ learnerId: 11, childId: 11, name: 'Bin', knownYear: 2015 }])
  })

  it('lists the account owner with childId null', () => {
    const result = learnersMissingFullDob([
      line({ studentId: null, learnerId: 1, learnerName: 'Demo Mẹ Bin', dobComplete: false, learnerDobYear: null }),
    ])
    expect(result).toEqual([{ learnerId: 1, childId: null, name: 'Demo Mẹ Bin', knownYear: null }])
  })

  it('lists each learner once even with several courses', () => {
    const result = learnersMissingFullDob([
      line({ cartItemId: 1, studentId: 11, learnerId: 11, learnerName: 'Bin', dobComplete: false }),
      line({ cartItemId: 2, studentId: 11, learnerId: 11, learnerName: 'Bin', dobComplete: false }),
      line({ cartItemId: 3, studentId: 12, learnerId: 12, learnerName: 'Su', dobComplete: false }),
    ])
    expect(result.map(learner => learner.learnerId)).toEqual([11, 12])
  })

  it('skips complete learners and lines from an older backend', () => {
    expect(learnersMissingFullDob([
      line({ studentId: 11, learnerId: 11, dobComplete: true }),
      line({ studentId: 12, studentName: 'Su' }),
    ])).toEqual([])
  })

  it('falls back to the student name', () => {
    const result = learnersMissingFullDob([line({ studentId: 11, learnerId: 11, studentName: 'Bin', dobComplete: false })])
    expect(result[0]?.name).toBe('Bin')
  })
})

describe('checkFullDob', () => {
  it('builds an iso date and keeps the year the guest gave', () => {
    expect(checkFullDob({ day: 2, month: 3, year: 2015 }, 2015, TODAY)).toEqual({ ok: true, dob: '2015-03-02', yearChanged: false })
  })

  it('flags a year that differs from the one given earlier', () => {
    expect(checkFullDob({ day: 2, month: 3, year: 2014 }, 2015, TODAY)).toEqual({ ok: true, dob: '2014-03-02', yearChanged: true })
  })

  it('has no earlier year to compare for the account owner', () => {
    expect(checkFullDob({ day: 2, month: 3, year: 1988 }, null, TODAY)).toMatchObject({ ok: true, yearChanged: false })
  })

  it('rejects dates that do not exist', () => {
    expect(checkFullDob({ day: 31, month: 2, year: 2015 }, 2015, TODAY)).toMatchObject({ ok: false })
    expect(checkFullDob({ day: 29, month: 2, year: 2015 }, 2015, TODAY)).toMatchObject({ ok: false })
    expect(checkFullDob({ day: 29, month: 2, year: 2016 }, 2016, TODAY)).toMatchObject({ ok: true })
  })

  it('rejects incomplete or future dates', () => {
    expect(checkFullDob({ day: 0, month: 3, year: 2015 }, 2015, TODAY)).toMatchObject({ ok: false })
    expect(checkFullDob({ day: 26, month: 10, year: 2026 }, null, TODAY)).toMatchObject({ ok: false })
    expect(checkFullDob({ day: 25, month: 10, year: 2026 }, null, TODAY)).toMatchObject({ ok: true })
  })
})

describe('nextLearnerMessage', () => {
  it('names the first learner and counts the rest', () => {
    const bin = { learnerId: 11, childId: 11, name: 'Bin', knownYear: 2015 }
    const su = { learnerId: 12, childId: 12, name: 'Su', knownYear: 2017 }
    expect(nextLearnerMessage([bin])).toBe('Nhập ngày sinh của Bin để tiếp tục')
    expect(nextLearnerMessage([bin, su])).toBe('Nhập ngày sinh của Bin và 1 người học khác để tiếp tục')
    expect(nextLearnerMessage([])).toBe('')
  })
})
