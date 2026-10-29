import { describe, expect, it } from 'vitest'
import { answerEndsAt, clockText, dayLabel, endsAt, nextLine, phaseAt, questionAt, untilText, type ArenaTiming } from './timeline'

const START = Date.UTC(2026, 9, 29, 13, 0, 0)
const t: ArenaTiming = { startsAt: START, openAt: START - 600_000, questionCount: 3, countdownSeconds: 10, answerSeconds: 15, revealSeconds: 5, gapSeconds: 60 }
const at = (s: number) => START + s * 1000

describe('arena timeline', () => {
  it('works out the moments of each question', () => {
    expect(questionAt(t, 1)).toBe(START)
    expect(questionAt(t, 3)).toBe(at(120))
    expect(answerEndsAt(t, 1)).toBe(at(15))
    expect(endsAt(t)).toBe(at(140))
  })

  it('walks through the phases', () => {
    expect(phaseAt(t, START - 700_000).kind).toBe('before')
    expect(phaseAt(t, START - 600_000).kind).toBe('open')
    expect(phaseAt(t, at(-11)).kind).toBe('open')
    expect(phaseAt(t, at(-10))).toMatchObject({ kind: 'countdown', qNo: 1, msToNext: 10_000 })
    expect(phaseAt(t, at(0)).kind).toBe('question')
    expect(phaseAt(t, at(14))).toMatchObject({ kind: 'question', qNo: 1, nextQNo: 2 })
    expect(phaseAt(t, at(15)).kind).toBe('reveal')
    expect(phaseAt(t, at(19)).kind).toBe('reveal')
    expect(phaseAt(t, at(20))).toMatchObject({ kind: 'lobby', qNo: 1, nextQNo: 2, msToNext: 40_000 })
    expect(phaseAt(t, at(50))).toMatchObject({ kind: 'countdown', qNo: 2 })
    expect(phaseAt(t, at(60)).kind).toBe('question')
    expect(phaseAt(t, at(139)).kind).toBe('reveal')
    expect(phaseAt(t, at(140)).kind).toBe('ended')
  })

  it('has no next question after the last', () => {
    expect(phaseAt(t, at(125))).toMatchObject({ kind: 'question', qNo: 3, nextQNo: 0, msToNext: 0 })
  })

  it('says how long to wait', () => {
    expect(untilText(252_000)).toBe('4 phút 12 giây')
    expect(untilText(38_000)).toBe('38 giây')
    expect(untilText(59_001)).toBe('1 phút 0 giây')
    expect(clockText(2 * 3600_000 + 14 * 60_000 + 33_000)).toBe('02:14:33')
    expect(nextLine(phaseAt(t, at(-250)))).toBe('Còn 4 phút 10 giây tới câu hỏi đầu tiên'.replace('4 phút 10', '4 phút 10'))
    expect(nextLine(phaseAt(t, at(22)))).toBe('Còn 38 giây tới câu hỏi tiếp theo')
    expect(nextLine(phaseAt(t, at(125)))).toBe('')
  })

  it('labels the day', () => {
    const now = new Date(2026, 9, 29, 10, 0).getTime()
    expect(dayLabel(new Date(2026, 9, 29, 20, 0).getTime(), now)).toBe('hôm nay')
    expect(dayLabel(new Date(2026, 9, 30, 20, 0).getTime(), now)).toBe('ngày mai')
    expect(dayLabel(new Date(2026, 10, 2, 20, 0).getTime(), now)).toBe('Thứ Hai 2/11')
  })
})
