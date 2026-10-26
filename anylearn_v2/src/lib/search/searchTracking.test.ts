import { describe, expect, it } from 'vitest'
import { randomId, trackingQuery } from './searchTracking'

describe('randomId', () => {
  it('builds an id the server accepts (letters and digits, 8 to 40 characters)', () => {
    const id = randomId()
    expect(id).toMatch(/^[a-z0-9]{20}$/)
  })

  it('uses the random source it is given', () => {
    expect(randomId(() => 0, 5)).toBe('aaaaa')
    expect(randomId(() => 0.999999, 3)).toBe('999')
  })
})

describe('trackingQuery', () => {
  it('always carries the ref and the browser id', () => {
    expect(trackingQuery({ ref: 'abc12345', sessionKey: 'sess1' })).toBe('&ref=abc12345&sk=sess1')
  })

  it('adds who the visitor searches for', () => {
    expect(trackingQuery({ ref: 'abc12345', sessionKey: 'sess1', audience: 'child', learnerAge: 9 }))
      .toBe('&ref=abc12345&sk=sess1&aud=child&lage=9')
  })

  it('keeps an age of zero', () => {
    expect(trackingQuery({ ref: 'abc12345', sessionKey: 'sess1', audience: 'child', learnerAge: 0 })).toContain('lage=0')
  })
})
