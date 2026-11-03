import { describe, expect, it } from 'vitest'
import { chapterPercent, chaptersDone, claimDue, currentChapter, orderRewards, rewardLines } from './rules'
import type { JourneyChapter } from '@/lib/api/gamification'

const ch = (no: number, over: Partial<JourneyChapter> = {}): JourneyChapter => ({
  no, title: `C${no}`, gift: '', coins: 0, open: true, complete: false, claimed: false, required: 2, requiredDone: 0, missions: [], ...over,
})

describe('journey rules', () => {
  it('throttles claims', () => {
    expect(claimDue(null, 1000)).toBe(true)
    expect(claimDue(1000, 30_000)).toBe(false)
    expect(claimDue(1000, 61_000)).toBe(true)
  })

  it('computes chapter progress', () => {
    expect(chapterPercent({ required: 4, requiredDone: 1, complete: false })).toBe(25)
    expect(chapterPercent({ required: 0, requiredDone: 0, complete: true })).toBe(100)
    expect(chapterPercent({ required: 2, requiredDone: 5, complete: true })).toBe(100)
  })

  it('picks the current chapter', () => {
    const chapters = [ch(1, { claimed: true }), ch(2), ch(3), ch(4, { open: false }), ch(5, { open: false })]
    expect(currentChapter({ chapters })?.no).toBe(2)
    expect(currentChapter({ chapters: chapters.map(c => ({ ...c, claimed: c.open })) })?.no).toBe(3)
    expect(chaptersDone({ chapters })).toBe(1)
  })

  it('writes what a reward gave', () => {
    const r = rewardLines({ kind: 'chapter', key: 'chapter:1', label: 'Xong chương 1: Làm quen', coins: 50, foundation: 5000, foundationLabel: '1 viên gạch', sticker: { name: 'Leo' } }, 'Leo Xu')
    expect(r.title).toBe('Hoàn thành chương! Làm quen')
    expect(r.gifts).toEqual(['+50 Leo Xu', 'Sticker Leo', 'Góp 1 viên gạch cho anyLEARN Foundation'])
    expect(rewardLines({ kind: 'mission', key: 'fav3', label: 'Thích 3 khóa học', coins: 30 }, 'Leo Xu').title).toBe('Xong nhiệm vụ: Thích 3 khóa học')
  })

  it('turns order rewards into Leo rewards', () => {
    expect(orderRewards([{ kind: 'first_order', points: 0, coins: 300 }, { kind: 'referral_buyer', points: 0, coins: 0 }])).toEqual([
      { kind: 'order', key: 'order:first_order', label: 'Quà đơn hàng đầu tiên', coins: 300, points: 0 },
    ])
    expect(orderRewards(null)).toEqual([])
  })
})
