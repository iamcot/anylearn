import { describe, expect, it } from 'vitest'
import { loadingProgress, messageAt } from './progress'

describe('loadingProgress', () => {
  it('starts small, only goes up and never reaches 100', () => {
    const values = [0, 1000, 4000, 10000, 60000].map(loadingProgress)
    expect(values[0]).toBeLessThan(10)
    expect([...values].sort((a, b) => a - b)).toEqual(values)
    expect(values.at(-1)!).toBeLessThan(100)
  })
})

describe('messageAt', () => {
  it('puts the name in and cycles', () => {
    const messages = ['Chào {name}', 'Hai']
    expect(messageAt(messages, 0, 'Bin')).toBe('Chào Bin')
    expect(messageAt(messages, 3, 'Bin')).toBe('Hai')
  })
})
