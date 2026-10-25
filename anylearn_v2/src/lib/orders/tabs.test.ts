import { describe, expect, it } from 'vitest'
import { defaultOrderTab, orderTab, parseOrderTab } from './tabs'

describe('orderTab', () => {
  it('groups the statuses', () => {
    expect(orderTab('new')).toBe('pending')
    expect(orderTab('pay_pending')).toBe('pending')
    expect(orderTab('delivered')).toBe('completed')
    expect(orderTab('cancel_system')).toBe('cancelled')
    expect(orderTab('refund')).toBe('cancelled')
  })
})

describe('defaultOrderTab', () => {
  it('follows the link when it names a tab', () => {
    expect(defaultOrderTab('cancelled', ['pay_pending'])).toBe('cancelled')
    expect(parseOrderTab('nope')).toBeNull()
  })

  it('opens pending first when something waits for payment', () => {
    expect(defaultOrderTab(null, ['delivered', 'pay_pending'])).toBe('pending')
  })

  it('otherwise opens the tab of the newest order', () => {
    expect(defaultOrderTab(null, ['cancel_buyer', 'delivered'])).toBe('cancelled')
    expect(defaultOrderTab(null, [])).toBe('completed')
  })
})
