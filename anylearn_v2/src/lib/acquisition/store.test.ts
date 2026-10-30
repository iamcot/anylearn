import { describe, expect, it } from 'vitest'
import { landingKey, nextAcquisition, parseAcquisition, readUtm, signupFields } from './store'

const NOW = Date.UTC(2026, 9, 29)
const DAY = 24 * 60 * 60 * 1000

describe('acquisition store', () => {
  it('reads UTM values from a link', () => {
    expect(readUtm('?utm_source=facebook&utm_campaign=ra-mat-v2&x=1')).toEqual({ utm_source: 'facebook', utm_campaign: 'ra-mat-v2' })
    expect(readUtm('?utm_source=%20')).toEqual({})
    expect(readUtm(`?utm_content=${'a'.repeat(200)}`).utm_content).toHaveLength(100)
  })

  it('keeps the first touch', () => {
    const first = nextAcquisition(null, '?utm_source=zalo', '/fun/explore/3/clip', NOW)
    expect(first).toEqual({ utm: { utm_source: 'zalo' }, landingPath: '/fun/explore/3/clip?utm_source=zalo', firstSeenAt: NOW })
    expect(nextAcquisition(first, '?utm_source=facebook', '/', NOW + DAY)).toBe(first)
    expect(nextAcquisition(null, '', '/', NOW)).toBeNull()
  })

  it('forgets after 30 days or when damaged', () => {
    const raw = JSON.stringify({ utm: { utm_source: 'zalo' }, landingPath: '/', firstSeenAt: NOW })
    expect(parseAcquisition(raw, NOW + 29 * DAY)?.utm.utm_source).toBe('zalo')
    expect(parseAcquisition(raw, NOW + 31 * DAY)).toBeNull()
    expect(parseAcquisition('{bad', NOW)).toBeNull()
    expect(parseAcquisition(JSON.stringify({ utm: {}, firstSeenAt: NOW }), NOW)).toBeNull()
  })

  it('builds the registration fields and the session key', () => {
    expect(signupFields(null)).toEqual({})
    expect(signupFields({ utm: { utm_source: 'zalo' }, landingPath: '/x', firstSeenAt: NOW }))
      .toEqual({ utm_source: 'zalo', landing_path: '/x', first_seen_at: '2026-10-29T00:00:00.000Z' })
    expect(landingKey({ utm_source: 'fb', utm_content: 'v1' })).toBe('landing:fb|||v1')
  })
})
