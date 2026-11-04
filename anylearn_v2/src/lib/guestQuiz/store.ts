// The guest quiz marks the browser so the next registration sends game `guest_quiz` (the server then pays the sign-up
// Leo Xu once). Kept a day; a referral link's own game wins over it.

const KEY = 'signup-game:v1'
const TTL_MS = 24 * 60 * 60 * 1000
export const GUEST_QUIZ_GAME = 'guest_quiz'

export function parseSignupGame(raw: string | null, now: number): string | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as { game?: unknown; at?: unknown }
    if (typeof v.game !== 'string' || typeof v.at !== 'number' || now - v.at > TTL_MS) return null
    return /^[a-z0-9_-]{1,30}$/.test(v.game) ? v.game : null
  } catch {
    return null
  }
}

export function markSignupGame(game: string) {
  try { localStorage.setItem(KEY, JSON.stringify({ game, at: Date.now() })) } catch { /* private mode */ }
}

export function readSignupGame(): string | null {
  try { return parseSignupGame(localStorage.getItem(KEY), Date.now()) } catch { return null }
}

export function clearSignupGame() {
  try { localStorage.removeItem(KEY) } catch { /* private mode */ }
}

/** Score line of the result screen. */
export function scoreLine(correct: number, total: number): string {
  if (total <= 0) return ''
  if (correct === total) return 'Tuyệt vời! Bạn trả lời đúng hết.'
  if (correct * 2 >= total) return 'Giỏi lắm! Bạn hiểu con nhiều đó.'
  return 'Không sao, mỗi câu là một điều mới để cùng con khám phá.'
}
