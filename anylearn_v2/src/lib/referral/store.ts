import { AFTER_REGISTER_INTRO, GAME_ROUTES, REFERRAL_TTL_DAYS } from '@/config/referral'

export interface Referral {
  code: string
  name: string
  game: string | null
  savedAt: number
}

const STORAGE_KEY = 'referral:v1'
const DAY_MS = 24 * 60 * 60 * 1000

/** A phone: digits only, +84 and 84 become a leading 0. A code with letters is kept as typed (same rule as the backend). Null when unusable. */
export function cleanCode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (/\p{L}/u.test(trimmed)) return /^[A-Za-z0-9_-]{4,30}$/.test(trimmed) ? trimmed : null
  let digits = raw.replace(/[^0-9]/g, '')
  if (digits.startsWith('84') && digits.length === 11) digits = '0' + digits.slice(2)
  return digits.length >= 8 && digits.length <= 15 ? digits : null
}

export function cleanGame(raw: string | null | undefined): string | null {
  const game = (raw ?? '').trim().toLowerCase()
  return /^[a-z0-9_-]{1,30}$/.test(game) ? game : null
}

/** The stored referral, or null when it is missing, damaged or older than the time limit. */
export function parseReferral(raw: string | null, now: number): Referral | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<Referral>
    const code = cleanCode(value.code)
    if (!code || typeof value.savedAt !== 'number') return null
    if (now - value.savedAt > REFERRAL_TTL_DAYS * DAY_MS) return null
    return { code, name: typeof value.name === 'string' ? value.name : '', game: cleanGame(value.game), savedAt: value.savedAt }
  } catch {
    return null
  }
}

/** Where to go after the account is created. */
export function afterRegisterPath(referral: Referral | null): string | null {
  if (!referral) return null
  return (referral.game && GAME_ROUTES[referral.game]) || AFTER_REGISTER_INTRO
}

export function readReferralRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function parseStoredReferral(raw: string | null): Referral | null {
  return parseReferral(raw, Date.now())
}

export function saveReferral(code: string, name: string, game: string | null, now = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, name, game, savedAt: now }))
  } catch {}
}

export function clearReferral(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
