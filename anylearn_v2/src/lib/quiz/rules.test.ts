import { describe, expect, it } from 'vitest'
import type { QuizProfile, QuizResult } from '@/lib/api/quiz'
import { guardWarning, remainingMs, resultTitle, secondsLeft, starPercent, starsLine, toggleMult } from './rules'

const profile = (over: Partial<QuizProfile>): QuizProfile => ({ rank: 1, rankName: 'Bạc', rankKey: 'bac', stars: 0, needed: 6, guard: false, streak: 0, bestRank: 1, bestRankName: 'Bạc', games: 0, correct: 0, wrong: 0, ranks: [], ...over })
const result = (over: Partial<QuizResult>): QuizResult => ({
  correct: false, outcome: 'wrong', correctIndex: 0, chosen: 1, explanation: null, starsGained: 0, rankedUp: false, rankedDown: false, guardLost: false,
  shieldUsed: false, multiplier: 1, starsBefore: 0, rankBefore: 0, reward: {}, drop: null, dropLabel: null, profile: profile({}), items: {}, coins: 0, ...over,
})

describe('quiz rules', () => {
  it('counts down on the server clock, not the phone clock', () => {
    // the phone is 5 minutes behind the server: offset = +300000
    expect(remainingMs(1_000_000, 300_000, 700_000)).toBe(0)
    expect(remainingMs(1_020_000, 300_000, 700_000)).toBe(20_000)
    expect(remainingMs(1_000_000, 0, 2_000_000)).toBe(0)
    expect(secondsLeft(19_001)).toBe(20)
  })

  it('fills the star bar and keeps the top rank full', () => {
    expect(starPercent(3, 6)).toBe(50)
    expect(starPercent(9, 6)).toBe(100)
    expect(starPercent(40, 0)).toBe(100)
  })

  it('toggles one lucky star item at a time', () => {
    expect(toggleMult(null, 'mult2')).toBe('mult2')
    expect(toggleMult('mult2', 'mult3')).toBe('mult3')
    expect(toggleMult('mult3', 'mult3')).toBeNull()
  })

  it('describes the stars of a result', () => {
    expect(starsLine(result({ correct: true, outcome: 'correct', starsGained: 3 }))).toBe('+3 sao')
    expect(starsLine(result({ shieldUsed: true }))).toMatch(/Khiên/)
    expect(starsLine(result({ guardLost: true }))).toMatch(/bảo hộ/)
    expect(starsLine(result({ starsGained: -1 }))).toBe('-1 sao')
    expect(starsLine(result({ rankedDown: true }))).toMatch(/Rớt/)
  })

  it('warns only at zero stars without the guard, above the lowest rank', () => {
    expect(guardWarning(profile({ stars: 0, guard: false }))).not.toBeNull()
    expect(guardWarning(profile({ stars: 0, guard: true }))).toBeNull()
    expect(guardWarning(profile({ stars: 2, guard: false }))).toBeNull()
    expect(guardWarning(profile({ rank: 0, stars: 0, guard: false }))).toBeNull()
  })

  it('titles the result by outcome', () => {
    expect(resultTitle(result({ correct: true, outcome: 'correct' }))).toBe('Chính xác!')
    expect(resultTitle(result({ outcome: 'timeout' }))).toBe('Hết giờ rồi')
    expect(resultTitle(result({ outcome: 'forfeit' }))).toMatch(/bỏ dở/)
  })
})
