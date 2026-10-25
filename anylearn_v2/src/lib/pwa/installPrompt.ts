export type Platform = 'ios' | 'android' | 'desktop'

// native: the browser can show its own install dialog. ios-guide: Safari needs "Chia sẻ > Thêm vào MH chính".
// open-in-browser: Zalo/Facebook in-app browsers cannot install, the person must open Safari/Chrome first.
export type InstallMode = 'hidden' | 'native' | 'ios-guide' | 'open-in-browser'

export interface InstallState {
  platform: Platform
  standalone: boolean
  inAppBrowser: boolean
  hasNativePrompt: boolean
  dismissedAt: string | null
  now: Date
  dismissDays: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const IN_APP_BROWSER_PATTERN = /Zalo|FBAN|FBAV|FB_IAB|Instagram|Line\//i

export function detectPlatform(userAgent: string, maxTouchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
  // iPadOS Safari reports itself as a Mac; touch support gives it away.
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'
  return 'desktop'
}

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP_BROWSER_PATTERN.test(userAgent)
}

export function isDismissedRecently(dismissedAt: string | null, now: Date, dismissDays: number): boolean {
  if (!dismissedAt) return false
  const dismissedTime = Date.parse(dismissedAt)
  if (Number.isNaN(dismissedTime)) return false
  return now.getTime() - dismissedTime < dismissDays * DAY_MS
}

export function installMode(state: InstallState): InstallMode {
  if (state.standalone) return 'hidden'
  if (isDismissedRecently(state.dismissedAt, state.now, state.dismissDays)) return 'hidden'
  if (state.inAppBrowser && state.platform !== 'desktop') return 'open-in-browser'
  if (state.hasNativePrompt) return 'native'
  if (state.platform === 'ios') return 'ios-guide'
  return 'hidden'
}
