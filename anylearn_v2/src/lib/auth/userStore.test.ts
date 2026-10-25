import { describe, expect, it } from 'vitest'
import { parseStoredUser } from './userStore'

describe('parseStoredUser', () => {
  it('returns null for empty or broken values', () => {
    expect(parseStoredUser(null)).toBeNull()
    expect(parseStoredUser('')).toBeNull()
    expect(parseStoredUser('{not json')).toBeNull()
    expect(parseStoredUser('"text"')).toBeNull()
  })

  it('returns null when the stored object has no token', () => {
    expect(parseStoredUser('{"id":1}')).toBeNull()
  })

  it('returns the stored user', () => {
    expect(parseStoredUser('{"id":1,"jwtToken":"t"}')).toEqual({ id: 1, jwtToken: 't' })
  })
})
