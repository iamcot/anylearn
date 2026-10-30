import { describe, expect, it } from 'vitest'
import { landingHref, landingPath, landingSearchUrl } from './landing'

describe('landing links', () => {
  it('builds the page link', () => {
    expect(landingHref('boi/5-tuoi/quan-7')).toBe('/hoc/boi/5-tuoi/quan-7')
    expect(landingHref('/boi/5-tuoi/quan-7/')).toBe('/hoc/boi/5-tuoi/quan-7')
  })

  it('checks the route segments', () => {
    expect(landingPath('boi', '5-tuoi', 'quan-7')).toBe('boi/5-tuoi/quan-7')
    expect(landingPath('boi', '5', 'quan-7')).toBeNull()
    expect(landingPath('Boi', '5-tuoi', 'quan-7')).toBeNull()
    expect(landingPath('boi', '5-tuoi', 'quan%207')).toBeNull()
  })

  it('opens the search with the same filters', () => {
    const url = landingSearchUrl({ tagId: 12, age: 5, provinceCode: '79', districtCode: '778' })
    expect(url).toBe('/search?location=79&district=778&ageFrom=5&ageTo=5&tag=12')
  })
})
