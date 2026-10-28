import { describe, expect, it } from 'vitest'
import { aliLines, reminderFor } from './ali'

const now = new Date(2026, 9, 28, 10, 0)
const day = (name: string, self: boolean, startAt: string | null) => ({
  learner: { id: 1, name, self },
  nextSession: startAt ? ({ title: 'Toán tư duy', startAt } as never) : null,
})

describe('aliLines', () => {
  it('asks to open the gift while it waits', () => {
    expect(aliLines({ kind: 'waiting' })[0]).toBe('Nhanh tay mở hộp xem hôm nay có quà gì nào!')
  })
  it('congratulates with the points after opening', () => {
    expect(aliLines({ kind: 'claimed', points: 10, streak: 3 })).toEqual([
      'Chúc mừng bạn đã nhận được 10 Ali Xu!', 'Chuỗi 3 ngày liên tiếp rồi, giỏi quá!',
    ])
  })
  it('says the gift is used up when capped with no points', () => {
    expect(aliLines({ kind: 'claimed', points: 5, sticker: 'Ali tên lửa' })).toEqual([
      'Chúc mừng bạn đã nhận được 5 Ali Xu!',
      'Wow, bạn còn nhận thêm sticker Ali tên lửa nữa nè!',
    ])
    expect(aliLines({ kind: 'claimed', points: 0, capped: true })).toEqual(['Hôm nay quà hết phần rồi, mai quay lại nhé!'])
  })
  it('adds the reminder after the gift is taken, not while opening', () => {
    expect(aliLines({ kind: 'done', daysToWeekGift: 2 }, 'Nhắc nhé').at(-1)).toBe('Nhắc nhé')
    expect(aliLines({ kind: 'opening' }, 'Nhắc nhé')).toHaveLength(1)
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
