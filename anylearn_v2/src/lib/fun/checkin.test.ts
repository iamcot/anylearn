import { describe, expect, it } from 'vitest'
import type { CheckinStatus } from '@/lib/api/fun'
import { afterClaim, claimMessage, giftNote } from './checkin'

const days = (current: number, claimed: boolean) =>
  [1, 2, 3, 4, 5, 6, 7].map(day => ({ day, points: day * 5, state: day < current || (day === current && claimed) ? 'done' as const : day === current ? 'today' as const : 'todo' as const }))

const status = (over: Partial<CheckinStatus> = {}): CheckinStatus =>
  ({ enabled: true, today: '2026-10-28', claimedToday: false, streak: 2, best: 5, dayInCycle: 3, nextPoints: 10, days: days(3, false), ...over })

describe('check-in view helpers', () => {
  it('says what the gift is worth before it is opened', () => {
    expect(giftNote(status())).toBe('Mở quà hôm nay nhận 10 anyPoint')
  })

  it('counts the days to the day 7 gift once claimed', () => {
    expect(giftNote(status({ claimedToday: true, dayInCycle: 3 }))).toBe('Đã nhận quà hôm nay, còn 4 ngày nữa tới quà ngày 7')
    expect(giftNote(status({ claimedToday: true, dayInCycle: 7 }))).toContain('tuần mới')
  })

  it('shows a closed gift', () => {
    expect(giftNote(status({ enabled: false }))).toBe('Quà điểm danh đang tạm đóng')
  })

  it('writes the claim message', () => {
    expect(claimMessage({ alreadyClaimed: false, points: 10 })).toBe('+10 anyPoint')
    expect(claimMessage({ alreadyClaimed: true, points: 0 })).toBe('Bạn đã nhận quà hôm nay rồi')
    expect(claimMessage({ alreadyClaimed: false, points: 0, capped: true })).toContain('hết phần')
  })

  it('updates the week after a claim', () => {
    const next = afterClaim(status(), { alreadyClaimed: false, points: 10, streak: 3, dayInCycle: 3 })
    expect(next.claimedToday).toBe(true)
    expect(next.streak).toBe(3)
    expect(next.days.filter(d => d.state === 'done')).toHaveLength(3)
    expect(next.best).toBe(5)
  })
})
