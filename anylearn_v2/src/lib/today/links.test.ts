import { describe, expect, it } from 'vitest'
import { BROWSE_HOME_URL, shouldRedirectToToday } from './links'

describe('shouldRedirectToToday', () => {
  it('sends learners with an enrollment to /today', () => {
    expect(shouldRedirectToToday({ enrolled: true, browsing: false })).toBe(true)
  })
  it('does not redirect while the person chose to browse (no loop)', () => {
    expect(shouldRedirectToToday({ enrolled: true, browsing: true })).toBe(false)
  })
  it('never redirects people without an enrollment', () => {
    expect(shouldRedirectToToday({ enrolled: false, browsing: false })).toBe(false)
  })
})

describe('BROWSE_HOME_URL', () => {
  it('carries the browse flag the home page looks for', () => {
    expect(new URLSearchParams(BROWSE_HOME_URL.split('?')[1]).has('browse')).toBe(true)
  })
})
