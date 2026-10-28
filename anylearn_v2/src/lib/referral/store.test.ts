import { describe, expect, it } from 'vitest'
import { afterRegisterPath, cleanCode, cleanGame, parseReferral } from './store'

const now = Date.UTC(2026, 9, 28)
const stored = (over: object = {}) => JSON.stringify({ code: '0901234567', name: 'Lan', game: null, savedAt: now, ...over })

describe('referral store', () => {
  it('cleans the code like the backend', () => {
    expect(cleanCode('0901 234 567')).toBe('0901234567')
    expect(cleanCode('+84901234567')).toBe('0901234567')
    expect(cleanCode('abc')).toBeNull()
    expect(cleanCode('123')).toBeNull()
  })

  it('accepts only simple game ids', () => {
    expect(cleanGame('Quiz')).toBe('quiz')
    expect(cleanGame('a b')).toBeNull()
    expect(cleanGame(undefined)).toBeNull()
  })

  it('reads a fresh referral and drops an old or damaged one', () => {
    expect(parseReferral(stored(), now + 1000)?.code).toBe('0901234567')
    expect(parseReferral(stored(), now + 31 * 24 * 3600 * 1000)).toBeNull()
    expect(parseReferral('not json', now)).toBeNull()
    expect(parseReferral(null, now)).toBeNull()
    expect(parseReferral(stored({ code: 'x' }), now)).toBeNull()
  })

  it('goes to the intro page with a code only, nowhere without a referral', () => {
    expect(afterRegisterPath(null)).toBeNull()
    expect(afterRegisterPath(parseReferral(stored(), now))).toBe('/info/why-anylearn')
  })

  it('a game id that has no page yet falls back to the intro page', () => {
    expect(afterRegisterPath(parseReferral(stored({ game: 'quiz' }), now))).toBe('/info/why-anylearn')
  })
})
