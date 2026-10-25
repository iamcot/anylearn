import { describe, expect, it } from 'vitest'
import { notificationOpenUrl, resolveNotificationRoute } from './route'

describe('resolveNotificationRoute', () => {
  it('maps portal routes to site pages', () => {
    expect(resolveNotificationRoute('/orders')).toBe('/account/orders')
    expect(resolveNotificationRoute('/account/calendar')).toBe('/account/schedule')
    expect(resolveNotificationRoute('/pdp', '42')).toBe('/class/42/khoa-hoc')
    expect(resolveNotificationRoute('/article')).toBe('/article')
  })

  it('returns null for admin, unknown or missing routes', () => {
    expect(resolveNotificationRoute('/admin/orders')).toBeNull()
    expect(resolveNotificationRoute('/something-else')).toBeNull()
    expect(resolveNotificationRoute(undefined)).toBeNull()
    expect(resolveNotificationRoute('/pdp')).toBeNull()
  })
})

describe('notificationOpenUrl', () => {
  it('keeps id, route and extra content', () => {
    expect(notificationOpenUrl(9, '/pdp', '42')).toBe('/notifications/open?id=9&route=%2Fpdp&extra=42')
  })

  it('works without any data', () => {
    expect(notificationOpenUrl(null)).toBe('/notifications/open')
  })
})
