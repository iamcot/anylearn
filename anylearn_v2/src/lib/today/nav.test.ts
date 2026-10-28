import { describe, expect, it } from 'vitest'
import { TODAY_NAV, inTodayZone, isNavActive } from './nav'

describe('isNavActive', () => {
  it('matches /today only exactly so sub pages do not light up Hôm nay', () => {
    expect(isNavActive('/today', '/today')).toBe(true)
    expect(isNavActive('/fun', '/today')).toBe(false)
  })
  it('matches other items by prefix', () => {
    expect(isNavActive('/fun', '/fun')).toBe(true)
    expect(isNavActive('/account', '/account')).toBe(true)
  })
  it('keeps the account tab active on every account page except the schedule', () => {
    expect(isNavActive('/account/orders', '/account')).toBe(true)
    expect(isNavActive('/account/schedule', '/account')).toBe(false)
    expect(isNavActive('/account/schedule', '/account/schedule')).toBe(true)
    expect(isNavActive('/search', '/account')).toBe(false)
  })
})

describe('TODAY_NAV', () => {
  it('has five tabs in this order, all in the header', () => {
    expect(TODAY_NAV).toHaveLength(5)
    expect(TODAY_NAV.filter(item => item.inHeader).map(item => item.label))
      .toEqual(['Lịch', 'Cộng đồng', 'Hôm nay', 'Vui học', 'Tài khoản'])
  })
})

describe('inTodayZone', () => {
  it('covers /today, /fun and /community with their sub pages only', () => {
    expect(inTodayZone('/today')).toBe(true)
    expect(inTodayZone('/fun')).toBe(true)
    expect(inTodayZone('/fun/quiz/board')).toBe(true)
    expect(inTodayZone('/community/12')).toBe(true)
    expect(inTodayZone('/funny')).toBe(false)
    expect(inTodayZone('/search')).toBe(false)
  })
})
