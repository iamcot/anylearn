import { describe, expect, it } from 'vitest'
import { pushPromptMode, urlBase64ToUint8Array, type PushPromptState } from './push'

const NOW = new Date('2026-10-25T10:00:00Z')

function state(overrides: Partial<PushPromptState> = {}): PushPromptState {
  return {
    serverEnabled: true,
    browserSupportsPush: true,
    permission: 'default',
    platform: 'android',
    standalone: false,
    dismissedAt: null,
    now: NOW,
    dismissDays: 14,
    ...overrides,
  }
}

describe('pushPromptMode', () => {
  it('asks on a browser that can receive push', () => {
    expect(pushPromptMode(state())).toBe('ask')
  })

  it('is off when the server has no keys', () => {
    expect(pushPromptMode(state({ serverEnabled: false }))).toBe('unsupported')
  })

  it('sends iPhone users to install first, then asks inside the app', () => {
    expect(pushPromptMode(state({ platform: 'ios' }))).toBe('needs-install')
    expect(pushPromptMode(state({ platform: 'ios', standalone: true }))).toBe('ask')
  })

  it('follows the browser decision', () => {
    expect(pushPromptMode(state({ permission: 'granted' }))).toBe('granted')
    expect(pushPromptMode(state({ permission: 'denied' }))).toBe('denied')
  })

  it('reports unsupported browsers', () => {
    expect(pushPromptMode(state({ browserSupportsPush: false }))).toBe('unsupported')
  })

  it('stays quiet after a recent "Để sau"', () => {
    expect(pushPromptMode(state({ dismissedAt: '2026-10-24T10:00:00Z' }))).toBe('hidden')
  })
})

describe('urlBase64ToUint8Array', () => {
  it('decodes base64url without padding', () => {
    expect(Array.from(urlBase64ToUint8Array('AQID_-8'))).toEqual([1, 2, 3, 255, 239])
  })
})
