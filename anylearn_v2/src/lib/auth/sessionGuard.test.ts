import { describe, expect, it } from 'vitest'
import { loginUrlAfterExpiry, needsLoginPage, sessionOutcome } from './sessionGuard'

describe('sessionOutcome', () => {
  it('ends the session on 401 for the current token', () => {
    expect(sessionOutcome('a', 'a', { status: 401, refreshedToken: null })).toBe('expired')
  })

  it('stores a refreshed token', () => {
    expect(sessionOutcome('a', 'a', { status: 200, refreshedToken: 'b' })).toBe('refreshed')
  })

  it('ignores answers to requests of an older sign-in', () => {
    expect(sessionOutcome('old', 'new', { status: 401, refreshedToken: null })).toBe('none')
  })

  it('ignores requests that carried no token', () => {
    expect(sessionOutcome(null, 'a', { status: 401, refreshedToken: null })).toBe('none')
  })

  it('does nothing for a normal answer', () => {
    expect(sessionOutcome('a', 'a', { status: 200, refreshedToken: null })).toBe('none')
  })
})

describe('needsLoginPage', () => {
  it('sends account pages to login but leaves public pages alone', () => {
    expect(needsLoginPage('/account/orders')).toBe(true)
    expect(needsLoginPage('/today')).toBe(true)
    expect(needsLoginPage('/')).toBe(false)
    expect(needsLoginPage('/class/12/piano')).toBe(false)
    expect(needsLoginPage('/accounting')).toBe(false)
  })
})

describe('loginUrlAfterExpiry', () => {
  it('comes back to the same page after signing in', () => {
    expect(loginUrlAfterExpiry('/account/orders', '?tab=pending')).toBe('/login?expired=1&redirect=%2Faccount%2Forders%3Ftab%3Dpending')
  })
})
