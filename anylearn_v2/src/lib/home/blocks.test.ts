import { describe, expect, it } from 'vitest'
import { forYouBlock, homeQuickLinks, hotNearBlock } from './blocks'

describe('forYouBlock', () => {
  it('is the popular list when nobody is chosen', () => {
    const block = forYouBlock({})
    expect(block.title).toBe('Khóa học được quan tâm nhiều')
    expect(block.extra).toEqual([])
  })

  it('filters by the age range of an account learner and links to the same search', () => {
    const block = forYouBlock({ learner: { name: 'Bin', chipKey: 'c7', ageFrom: 15, ageTo: 15 } })
    expect(block.title).toBe('Dành cho Bin')
    expect(block.extra).toEqual([['ageFrom', '15'], ['ageTo', '15']])
    expect(block.seeAllHref).toBe('/search?for=c7&ageFrom=15&ageTo=15')
  })

  it('uses the age bucket of a visitor', () => {
    const block = forYouBlock({ learner: { name: 'Su', ageBucket: '6-10' } })
    expect(block.age).toBe('6-10')
    expect(block.seeAllHref).toBe('/search?age=6-10')
  })
})

describe('hotNearBlock', () => {
  it('needs a position', () => {
    expect(hotNearBlock({})).toBeNull()
    const block = hotNearBlock({ near: { lat: 10.78, lng: 106.7 } })
    expect(block?.extra).toEqual([['nearLat', '10.78'], ['nearLng', '106.7'], ['radiusKm', '15']])
  })
})

describe('homeQuickLinks', () => {
  it('builds search links for each chip', () => {
    const links = Object.fromEntries(homeQuickLinks().map(link => [link.label, link.href]))
    expect(links['Học thử']).toBe('/search?freeTrial=1')
    expect(links['Online']).toBe('/search?hinhthuc=online')
    expect(links['Gần tôi']).toBe('/search?locate=1')
    expect(links['Cuối tuần']).toContain('slot=weekend_morning')
  })
})
