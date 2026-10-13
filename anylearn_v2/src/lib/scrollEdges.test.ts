import { describe, expect, it } from 'vitest'
import { scrollEdges } from './scrollEdges'

describe('scrollEdges', () => {
  it('shows only the right edge at the start of a long row', () => {
    expect(scrollEdges(0, 300, 800)).toEqual({ canLeft: false, canRight: true })
  })
  it('shows both edges in the middle', () => {
    expect(scrollEdges(200, 300, 800)).toEqual({ canLeft: true, canRight: true })
  })
  it('shows only the left edge at the end', () => {
    expect(scrollEdges(500, 300, 800)).toEqual({ canLeft: true, canRight: false })
  })
  it('shows nothing when everything fits', () => {
    expect(scrollEdges(0, 300, 300)).toEqual({ canLeft: false, canRight: false })
  })
  it('ignores tiny leftovers so edges do not flicker', () => {
    expect(scrollEdges(4, 300, 305)).toEqual({ canLeft: false, canRight: false })
  })
})
