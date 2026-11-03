import { describe, expect, it } from 'vitest'
import { parseSignupGame, scoreLine } from './store'

describe('guest quiz', () => {
  it('keeps the sign-up game a day', () => {
    const now = 1_000_000_000
    expect(parseSignupGame(JSON.stringify({ game: 'guest_quiz', at: now - 1000 }), now)).toBe('guest_quiz')
    expect(parseSignupGame(JSON.stringify({ game: 'guest_quiz', at: now - 25 * 3600_000 }), now)).toBeNull()
    expect(parseSignupGame(JSON.stringify({ game: 'Bad Game', at: now }), now)).toBeNull()
    expect(parseSignupGame('oops', now)).toBeNull()
    expect(parseSignupGame(null, now)).toBeNull()
  })

  it('writes the score line', () => {
    expect(scoreLine(5, 5)).toBe('Tuyệt vời! Bạn trả lời đúng hết.')
    expect(scoreLine(3, 5)).toBe('Giỏi lắm! Bạn hiểu con nhiều đó.')
    expect(scoreLine(1, 5)).toMatch(/^Không sao/)
  })
})
