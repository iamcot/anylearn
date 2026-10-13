import { describe, expect, it } from 'vitest'
import { TODAY_NAV, isNavActive } from './nav'

describe('isNavActive', () => {
  it('matches /today only exactly so sub pages do not light up Hôm nay', () => {
    expect(isNavActive('/today', '/today')).toBe(true)
    expect(isNavActive('/today/diary', '/today')).toBe(false)
  })
  it('matches other items by prefix', () => {
    expect(isNavActive('/today/diary', '/today/diary')).toBe(true)
    expect(isNavActive('/account/profile', '/account/profile')).toBe(true)
  })
  it('keeps the account tab active on every account page except the schedule', () => {
    expect(isNavActive('/account/orders', '/account/profile')).toBe(true)
    expect(isNavActive('/account/schedule', '/account/profile')).toBe(false)
    expect(isNavActive('/account/schedule', '/account/schedule')).toBe(true)
    expect(isNavActive('/search', '/account/profile')).toBe(false)
  })
})

describe('TODAY_NAV', () => {
  it('has five tabs and four header items (community is mobile only for now)', () => {
    expect(TODAY_NAV).toHaveLength(5)
    expect(TODAY_NAV.filter(item => item.inHeader).map(item => item.label))
      .toEqual(['Hôm nay', 'Lịch', 'Nhật ký', 'Tài khoản'])
  })
})
