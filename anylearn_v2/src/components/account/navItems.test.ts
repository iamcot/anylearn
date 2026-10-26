import { describe, expect, it } from 'vitest'
import { accountPageTitle } from './navItems'

describe('accountPageTitle', () => {
  it('names a page and its sub-pages by the menu item', () => {
    expect(accountPageTitle('/account/orders')).toBe('Đơn hàng của tôi')
    expect(accountPageTitle('/account/children/12')).toBe('Tài khoản của con')
  })
  it('falls back to the account home', () => {
    expect(accountPageTitle('/account')).toBe('Tài khoản')
  })
})
