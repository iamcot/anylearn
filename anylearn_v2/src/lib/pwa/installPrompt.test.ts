import { describe, expect, it } from 'vitest'
import { detectPlatform, installMode, isDismissedRecently, isInAppBrowser, type InstallState } from './installPrompt'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1'
const IPAD_AS_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36'
const ZALO_ANDROID = `${ANDROID} Zalo android/12100648 ZaloTheme/light ZaloLanguage/vn`
const FACEBOOK_IOS = `${IPHONE} [FBAN/FBIOS;FBAV/460.0.0.36.106]`

const NOW = new Date('2026-10-25T10:00:00Z')

function state(overrides: Partial<InstallState> = {}): InstallState {
  return {
    platform: 'android',
    standalone: false,
    inAppBrowser: false,
    hasNativePrompt: false,
    dismissedAt: null,
    now: NOW,
    dismissDays: 14,
    ...overrides,
  }
}

describe('detectPlatform', () => {
  it('recognises iPhone, Android and desktop', () => {
    expect(detectPlatform(IPHONE)).toBe('ios')
    expect(detectPlatform(ANDROID)).toBe('android')
    expect(detectPlatform(IPAD_AS_MAC)).toBe('desktop')
  })

  it('treats a touch Mac as an iPad', () => {
    expect(detectPlatform(IPAD_AS_MAC, 5)).toBe('ios')
  })
})

describe('isInAppBrowser', () => {
  it('spots Zalo and Facebook browsers', () => {
    expect(isInAppBrowser(ZALO_ANDROID)).toBe(true)
    expect(isInAppBrowser(FACEBOOK_IOS)).toBe(true)
    expect(isInAppBrowser(ANDROID)).toBe(false)
    expect(isInAppBrowser(IPHONE)).toBe(false)
  })
})

describe('isDismissedRecently', () => {
  it('hides within the window and shows again after it', () => {
    expect(isDismissedRecently('2026-10-20T10:00:00Z', NOW, 14)).toBe(true)
    expect(isDismissedRecently('2026-10-01T10:00:00Z', NOW, 14)).toBe(false)
  })

  it('ignores a missing or broken value', () => {
    expect(isDismissedRecently(null, NOW, 14)).toBe(false)
    expect(isDismissedRecently('not a date', NOW, 14)).toBe(false)
  })
})

describe('installMode', () => {
  it('hides when the app already runs installed', () => {
    expect(installMode(state({ standalone: true, hasNativePrompt: true }))).toBe('hidden')
  })

  it('hides after a recent "Để sau"', () => {
    expect(installMode(state({ hasNativePrompt: true, dismissedAt: '2026-10-24T10:00:00Z' }))).toBe('hidden')
  })

  it('asks Zalo or Facebook users to open a real browser', () => {
    expect(installMode(state({ inAppBrowser: true }))).toBe('open-in-browser')
    expect(installMode(state({ platform: 'ios', inAppBrowser: true }))).toBe('open-in-browser')
  })

  it('uses the browser dialog when it is available', () => {
    expect(installMode(state({ hasNativePrompt: true }))).toBe('native')
    expect(installMode(state({ platform: 'desktop', hasNativePrompt: true }))).toBe('native')
  })

  it('shows the Safari guide on iOS', () => {
    expect(installMode(state({ platform: 'ios' }))).toBe('ios-guide')
  })

  it('stays hidden when nothing can install', () => {
    expect(installMode(state())).toBe('hidden')
    expect(installMode(state({ platform: 'desktop' }))).toBe('hidden')
  })
})
