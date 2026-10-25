import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, activeFilterCount, buildSearchUrl, parseSearchParams, toApiFilters, type SearchState } from './query'

const BASE: SearchState = { q: '', mode: 'class', sort: 'popular', page: 0, filters: DEFAULT_FILTERS }

describe('parseSearchParams', () => {
  it('uses defaults for an empty query string', () => {
    expect(parseSearchParams(new URLSearchParams(''))).toEqual({
      q: '', mode: 'class', category: undefined, authorId: undefined, sort: 'popular', page: 0, filters: DEFAULT_FILTERS,
    })
  })

  it('reads every parameter', () => {
    const state = parseSearchParams(new URLSearchParams(
      'q=piano&mode=school&category=am-nhac&authorId=9&sort=newest&age=6-10&price=under2&location=79&hinhthuc=online&page=3',
    ))
    expect(state).toEqual({
      q: 'piano', mode: 'school', category: 'am-nhac', authorId: 9, sort: 'newest', page: 2,
      filters: { age: '6-10', price: 'under2', location: '79', hinhthuc: 'online' },
    })
  })

  it('falls back to class mode and ignores a bad author id or page', () => {
    const state = parseSearchParams(new URLSearchParams('mode=other&authorId=abc&page=-4'))
    expect(state.mode).toBe('class')
    expect(state.authorId).toBeUndefined()
    expect(state.page).toBe(0)
  })
})

describe('buildSearchUrl', () => {
  it('leaves out default values', () => {
    expect(buildSearchUrl(BASE)).toBe('/search?')
  })

  it('round-trips a full state', () => {
    const state: SearchState = {
      q: 'tiếng Anh', mode: 'class', category: 'tieng-anh', authorId: 3, sort: 'priceLow', page: 1,
      filters: { age: '3-5', price: '2to5', location: '01', hinhthuc: 'offline' },
    }
    const url = buildSearchUrl(state)
    expect(parseSearchParams(new URLSearchParams(url.split('?')[1]))).toEqual(state)
  })

  it('keeps location and hinhthuc, which older code dropped on paging and sorting', () => {
    const url = buildSearchUrl({ ...BASE, filters: { ...DEFAULT_FILTERS, location: '79', hinhthuc: 'online' } })
    expect(url).toContain('location=79')
    expect(url).toContain('hinhthuc=online')
  })
})

describe('activeFilterCount', () => {
  it('counts the category and every non-default filter', () => {
    expect(activeFilterCount(BASE)).toBe(0)
    expect(activeFilterCount({ category: 'ielts', filters: { ...DEFAULT_FILTERS, age: '6-10', price: 'over5' } })).toBe(3)
  })
})

describe('toApiFilters', () => {
  it('turns "all" into undefined and renames price', () => {
    expect(toApiFilters(DEFAULT_FILTERS)).toEqual({ age: undefined, priceRange: undefined, location: undefined, hinhthuc: undefined })
    expect(toApiFilters({ ...DEFAULT_FILTERS, price: '2to5' }).priceRange).toBe('2to5')
  })
})
