import { describe, expect, it } from 'vitest'
import { discoverParams, discoverTitle } from './discover'

describe('discoverParams', () => {
  it('is empty when nobody is chosen', () => {
    expect(discoverParams({})).toEqual([])
    expect(discoverTitle({})).toBe('Thử điều mới cho con')
  })

  it('sends the age range, the position and a seed per child', () => {
    const ctx = { learner: { name: 'Bin', chipKey: 'c7', ageFrom: 8, ageTo: 9 }, near: { lat: 10.77, lng: 106.7 } }
    expect(discoverParams(ctx)).toEqual([['ageFrom', '8'], ['ageTo', '9'], ['nearLat', '10.77'], ['nearLng', '106.7'], ['seed', 'c7']])
    expect(discoverTitle(ctx)).toBe('Thử điều mới cho Bin')
  })
})
