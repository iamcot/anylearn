import { describe, expect, it } from 'vitest'
import { accountPageTitle } from './navItems'

describe('accountPageTitle', () => {
  it('names a page and its sub-pages by the menu item', () => {
    expect(accountPageTitle('/account/orders')).toBe('Khóa học của tôi')
    expect(accountPageTitle('/account/children/12')).toBe('Quản lý người học')
  })
  it('falls back to the account home', () => {
    expect(accountPageTitle('/account')).toBe('Tài khoản')
  })
})
