import { detectPlatform, type Platform } from '@/lib/pwa/installPrompt'

// Browser-only helpers: call them in event handlers, effects or after useIsClient() is true.
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

export function currentPlatform(): Platform {
  return detectPlatform(navigator.userAgent, navigator.maxTouchPoints)
}

export function browserSupportsPush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function notificationPermission(): NotificationPermission {
  return 'Notification' in window ? Notification.permission : 'default'
}

export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// Private mode can block storage; callers then just behave as if nothing was saved.
export function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {}
}
