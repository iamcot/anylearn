import { describe, expect, it } from 'vitest'
import { chatLines, energyValue, leoLines, quizLobbyContext, quizLobbyLines, quizResultContext, quizResultLines, reminderFor } from './leo'

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

describe('check-in item line', () => {
  it('names the item after the gift', () => {
    expect(leoLines({ kind: 'claimed', points: 10, item: 'Khiên bảo hộ' })).toContain('Hôm nay còn có thêm vật phẩm Khiên bảo hộ cho Leo rank nữa đó!')
  })
})

describe('quizLobbyLines', () => {
  it('puts a full star bar first', () => {
    expect(quizLobbyLines({ kind: 'quizLobby', nearRankUp: true, boxReady: true })[0]).toMatch(/lên hạng/)
  })
  it('warns when energy is 3 or less and says nothing when it is unknown or high', () => {
    expect(quizLobbyLines({ kind: 'quizLobby', energy: 3 }).some(l => l.includes('Năng lượng còn 3'))).toBe(true)
    expect(quizLobbyLines({ kind: 'quizLobby', energy: 0 })[0]).toMatch(/Hết năng lượng/)
    expect(quizLobbyLines({ kind: 'quizLobby', energy: 4 }).some(l => l.includes('ăng lượng'))).toBe(false)
    expect(quizLobbyLines({ kind: 'quizLobby', energy: null }).some(l => l.includes('ăng lượng'))).toBe(false)
  })
  it('mentions the waiting box and training, and always ends with a greeting', () => {
    const lines = quizLobbyLines({ kind: 'quizLobby', boxReady: true, practice: true, seed: 1 })
    expect(lines.some(l => l.includes('hộp quà'))).toBe(true)
    expect(lines.some(l => l.includes('tập luyện'))).toBe(true)
    expect(quizLobbyLines({ kind: 'quizLobby' })).toHaveLength(1)
  })
  it('builds the context from /quiz/me and tolerates a missing energy', () => {
    const me = { profile: { stars: 5, needed: 5, streak: 4, rankName: 'Đồng' }, boxReady: false }
    const ctx = quizLobbyContext(me)
    expect(ctx.nearRankUp).toBe(true)
    expect(ctx.energy).toBeNull()
    expect(ctx.practice).toBe(false)
    expect(quizLobbyContext({ ...me, energy: { current: 2 }, activePackId: 7 })).toMatchObject({ energy: 2, practice: true })
    expect(quizLobbyContext({ ...me, profile: { ...me.profile, needed: 0 } }).nearRankUp).toBe(false)
    expect(leoLines(ctx)[0]).toMatch(/lên hạng/)
  })
  it('reads energy from a number or an object', () => {
    expect(energyValue(12)).toBe(12)
    expect(energyValue({ value: 4 })).toBe(4)
    expect(energyValue(undefined)).toBeNull()
  })
})

describe('quizResultLines', () => {
  const base = { correct: true, outcome: 'correct', starsGained: 1, rankedUp: false, rankedDown: false, guardLost: false, shieldUsed: false, profile: { streak: 1, rankName: 'Bạc' } }
  it('cheers a right answer and a streak of 3 or more', () => {
    expect(quizResultLines(quizResultContext(base))[0]).toMatch(/Chính xác/)
    expect(quizResultLines(quizResultContext({ ...base, profile: { streak: 4, rankName: 'Bạc' } }))[0]).toMatch(/Đúng liền 4/)
  })
  it('says the rank up before anything else', () => {
    expect(quizResultLines(quizResultContext({ ...base, rankedUp: true }))[0]).toMatch(/Lên hạng Bạc/)
  })
  it('comforts after a wrong answer: lost star, shield saved, guard lost, rank down, timeout', () => {
    const wrong = { ...base, correct: false, outcome: 'wrong', starsGained: 0, profile: { streak: 0, rankName: 'Bạc' } }
    expect(quizResultLines(quizResultContext({ ...wrong, starsGained: -1 }))[0]).toMatch(/Mất một sao/)
    expect(quizResultLines(quizResultContext({ ...wrong, shieldUsed: true }))[0]).toMatch(/Khiên/)
    expect(quizResultLines(quizResultContext({ ...wrong, guardLost: true }))[0]).toMatch(/bảo hộ/)
    expect(quizResultLines(quizResultContext({ ...wrong, rankedDown: true }))[0]).toMatch(/Rớt xuống/)
    expect(quizResultLines(quizResultContext({ ...wrong, outcome: 'timeout' }))[0]).toMatch(/Hết giờ/)
    expect(quizResultLines(quizResultContext(wrong))[0]).toMatch(/Chưa đúng/)
  })
  it('uses the training wording in practice mode', () => {
    expect(quizResultLines(quizResultContext(base, true))[0]).toMatch(/tập luyện/)
  })
})
