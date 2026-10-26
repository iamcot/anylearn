import { describe, expect, it } from 'vitest'
import { isChunkLoadError, mayReloadNow } from './chunkReload'

describe('isChunkLoadError', () => {
  it('recognises the errors of a missing script file', () => {
    expect(isChunkLoadError({ name: 'ChunkLoadError', message: 'Loading chunk 123 failed.' })).toBe(true)
    expect(isChunkLoadError({ message: 'Failed to fetch dynamically imported module: https://x/a.js' })).toBe(true)
  })

  it('leaves other errors alone', () => {
    expect(isChunkLoadError({ name: 'TypeError', message: 'x is undefined' })).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})

describe('mayReloadNow', () => {
  it('reloads the first time and not again within the cooldown', () => {
    expect(mayReloadNow(null, 1_000)).toBe(true)
    expect(mayReloadNow(1_000, 10_000)).toBe(false)
    expect(mayReloadNow(1_000, 40_000)).toBe(true)
  })
})
