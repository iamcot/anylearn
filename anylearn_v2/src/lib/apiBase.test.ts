import { describe, expect, it } from 'vitest'
import { resolveApiBase } from './apiBase'

describe('resolveApiBase', () => {
  it('uses the same-origin path in the browser by default', () => {
    expect(resolveApiBase(undefined, undefined, false)).toBe('/v2/api')
  })

  it('points server rendering at the Java server for a relative base', () => {
    expect(resolveApiBase('/v2/api', undefined, true)).toBe('http://localhost:8080/v2/api')
    expect(resolveApiBase(undefined, 'http://10.0.0.5:8080', true)).toBe('http://10.0.0.5:8080/v2/api')
  })

  it('keeps an absolute base as is on both sides', () => {
    const absolute = 'https://anylearn.vn/v2/api'
    expect(resolveApiBase(absolute, undefined, false)).toBe(absolute)
    expect(resolveApiBase(absolute, 'http://localhost:8080', true)).toBe(absolute)
  })
})
