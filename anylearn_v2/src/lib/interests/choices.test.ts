import { describe, expect, it } from 'vitest'
import { toggleBudget, toggleChoice } from './choices'

describe('toggleChoice', () => {
  it('adds and removes a choice', () => {
    expect(toggleChoice(['chess'], 'art')).toEqual(['chess', 'art'])
    expect(toggleChoice(['chess', 'art'], 'chess')).toEqual(['art'])
  })

  it('ignores a ninth choice', () => {
    const eight = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    expect(toggleChoice(eight, 'i')).toEqual(eight)
  })
})

describe('toggleBudget', () => {
  it('picks one and clears it on a second tap', () => {
    expect(toggleBudget(null, 'lt500')).toBe('lt500')
    expect(toggleBudget('lt500', 'gt2000')).toBe('gt2000')
    expect(toggleBudget('gt2000', 'gt2000')).toBeNull()
  })
})
