import { describe, expect, it } from 'vitest'
import { chatLines, leoLines, reminderFor } from './leo'

const now = new Date(2026, 9, 28, 10, 0)
const day = (name: string, self: boolean, startAt: string | null) => ({
  learner: { id: 1, name, self },
  nextSession: startAt ? ({ title: 'Toán tư duy', startAt } as never) : null,
})

describe('leoLines', () => {
  it('asks to open the gift while it waits', () => {
    expect(leoLines({ kind: 'waiting' })[0]).toBe('Nhanh tay mở hộp xem hôm nay có quà gì nào!')
  })
  it('congratulates with the points after opening', () => {
    expect(leoLines({ kind: 'claimed', points: 10, streak: 3 })).toEqual([
      'Chúc mừng bạn đã nhận được 10 Leo Xu!', 'Chuỗi 3 ngày liên tiếp rồi, giỏi quá!',
    ])
  })
  it('says the gift is used up when capped with no points', () => {
    expect(leoLines({ kind: 'claimed', points: 5, sticker: 'Leo tên lửa' })).toEqual([
      'Chúc mừng bạn đã nhận được 5 Leo Xu!',
      'Wow, bạn còn nhận thêm sticker Leo tên lửa nữa nè!',
    ])
    expect(leoLines({ kind: 'claimed', points: 0, capped: true })).toEqual(['Hôm nay quà hết phần rồi, mai quay lại nhé!'])
  })
  it('adds the reminder after the gift is taken, not while opening', () => {
    expect(leoLines({ kind: 'done', daysToWeekGift: 2 }, 'Nhắc nhé').at(-1)).toBe('Nhắc nhé')
    expect(leoLines({ kind: 'opening' }, 'Nhắc nhé')).toHaveLength(1)
  })
})

describe('reminderFor', () => {
  it('names the learner and the time of the next class today', () => {
    const text = reminderFor([day('Bin', false, '2026-10-28T18:00:00')], now)
    expect(text).toContain('Bé Bin')
    expect(text).toContain('Toán tư duy')
    expect(text).toContain('18:00')
  })
  it('picks the earliest class and says "sắp" when it is close', () => {
    const text = reminderFor([day('Bin', false, '2026-10-28T18:00:00'), day('Su', false, '2026-10-28T10:20:00')], now)
    expect(text).toContain('Bé Su')
    expect(text).toContain('sắp có lớp')
  })
  it('ignores classes that started or are on another day', () => {
    expect(reminderFor([day('Bin', false, '2026-10-28T09:00:00'), day('Su', true, '2026-10-29T10:00:00')], now)).toBeNull()
    expect(reminderFor([day('Bin', false, null)], now)).toBeNull()
  })
  it('talks to the account owner directly', () => {
    expect(reminderFor([day('Mẹ', true, '2026-10-28T18:00:00')], now)).toMatch(/^Bạn có lớp/)
  })
})

describe('chatLines', () => {
  it('asks about rank depending on whether the player played today', () => {
    expect(chatLines({ playedToday: false, seed: 0 })[0]).toMatch(/leo rank chưa/)
    expect(chatLines({ playedToday: true, seed: 0 })[0]).toMatch(/leo rank rồi/)
  })
  it('asks about the child only when there is one', () => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7].flatMap(seed => chatLines({ childName: 'Bin', seed }))
    expect(all.some(l => l.includes('Bin'))).toBe(true)
    expect([0, 1, 2, 3, 4, 5].flatMap(seed => chatLines({ seed })).some(l => l.includes('bé '))).toBe(false)
  })
  it('joins the lines of the done context and varies by seed', () => {
    expect(leoLines({ kind: 'done', daysToWeekGift: 2 }, null, { seed: 1 }).length).toBeGreaterThan(2)
    expect(chatLines({ seed: 1 })).not.toEqual(chatLines({ seed: 2 }))
  })
})
