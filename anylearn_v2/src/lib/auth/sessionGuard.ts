import { API_BASE } from '@/lib/apiBase'
import { parseStoredUser, readStoredUserRaw, writeStoredUser } from '@/lib/auth/userStore'

export const REFRESHED_TOKEN_HEADER = 'X-Refreshed-Token'

// Pages that make no sense without an account: an expired session sends the person to the login page from here.
const PROTECTED_PREFIXES = ['/account', '/checkout', '/order', '/today', '/add2cart', '/join', '/notifications']

export type SessionOutcome = 'expired' | 'refreshed' | 'none'

interface ResponseFacts {
  status: number
  refreshedToken: string | null
}

/** What an API answer means for the stored session. `sentToken` is the Bearer token the request carried, if any. */
export function sessionOutcome(sentToken: string | null, storedToken: string | null, answer: ResponseFacts): SessionOutcome {
  // A late answer to a request made before another sign-in must not touch the new session.
  if (!sentToken || sentToken !== storedToken) return 'none'
  if (answer.status === 401) return 'expired'
  if (answer.refreshedToken) return 'refreshed'
  return 'none'
}

export function needsLoginPage(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function loginUrlAfterExpiry(pathname: string, search: string): string {
  return `/login?expired=1&redirect=${encodeURIComponent(pathname + search)}`
}

export function bearerOf(input: RequestInfo | URL, init?: RequestInit): string | null {
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
  const value = headers.get('Authorization')
  return value?.startsWith('Bearer ') ? value.slice('Bearer '.length) : null
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  return input instanceof URL ? input.href : input.url
}

function storedToken(): string | null {
  return parseStoredUser(readStoredUserRaw())?.jwtToken ?? null
}

function applyOutcome(outcome: SessionOutcome, refreshedToken: string | null) {
  const current = parseStoredUser(readStoredUserRaw())
  if (!current) return
  if (outcome === 'refreshed' && refreshedToken) {
    writeStoredUser({ ...current, jwtToken: refreshedToken })
    return
  }
  if (outcome !== 'expired') return
  writeStoredUser(null)
  const { pathname, search } = window.location
  if (needsLoginPage(pathname)) window.location.assign(loginUrlAfterExpiry(pathname, search))
}

let installed = false

/** Watches every API call of the page: a 401 ends the stored session, a refreshed token replaces the old one. */
export function installSessionGuard() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init)
    if (!urlOf(input).startsWith(API_BASE)) return response
    const refreshedToken = response.headers.get(REFRESHED_TOKEN_HEADER)
    const outcome = sessionOutcome(bearerOf(input, init), storedToken(), { status: response.status, refreshedToken })
    if (outcome !== 'none') applyOutcome(outcome, refreshedToken)
    return response
  }
}
