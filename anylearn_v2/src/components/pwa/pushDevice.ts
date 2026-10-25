import { getPushServerInfo, subscribePushDevice, unsubscribePushDevice, type PushServerInfo } from '@/lib/api'
import { PUSH_OPT_OUT_KEY, PUSH_SUBSCRIBE_TIMEOUT_MS, PUSH_SYNCED_KEY } from '@/config/pwa'
import { urlBase64ToUint8Array } from '@/lib/pwa/push'
import { browserSupportsPush, currentPlatform, isStandalone, notificationPermission, readLocal, writeLocal } from './environment'

let serverInfo: Promise<PushServerInfo> | null = null

export function loadPushServerInfo(): Promise<PushServerInfo> {
  serverInfo ??= getPushServerInfo()
  return serverInfo
}

function sameKey(subscription: PushSubscription, key: Uint8Array): boolean {
  const current = subscription.options.applicationServerKey
  if (!current) return false
  const bytes = new Uint8Array(current)
  return bytes.length === key.length && bytes.every((byte, index) => byte === key[index])
}

// Reuses the browser's subscription; a subscription made with an older server key cannot be reused.
async function browserSubscription(publicKey: string): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready
  const key = urlBase64ToUint8Array(publicKey)
  const existing = await registration.pushManager.getSubscription()
  if (existing && sameKey(existing, key)) return existing
  if (existing) await existing.unsubscribe()
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

export async function registerPushDevice(token: string, publicKey: string): Promise<boolean> {
  try {
    const json = (await withTimeout(browserSubscription(publicKey), PUSH_SUBSCRIBE_TIMEOUT_MS)).toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return false
    const { error } = await subscribePushDevice({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      platform: currentPlatform(),
      standalone: isStandalone(),
    }, token)
    if (error) return false
    writeLocal(PUSH_OPT_OUT_KEY, null)
    return true
  } catch {
    return false
  }
}

// Logout or "Tắt trên thiết bị này": the server forgets the device and the browser drops the subscription.
export async function forgetPushDevice(token: string, { optOut = false } = {}) {
  writeLocal(PUSH_SYNCED_KEY, null)
  if (optOut) writeLocal(PUSH_OPT_OUT_KEY, '1')
  if (!browserSupportsPush()) return
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) return
    await unsubscribePushDevice(subscription.endpoint, token)
    await subscription.unsubscribe()
  } catch {}
}

export function isPushOptedOut(): boolean {
  return readLocal(PUSH_OPT_OUT_KEY) === '1'
}

// Runs when a logged-in person opens the site: if they allowed notifications before (here or in an older version
// that asked at login), make sure the server knows this device. Once per account per browser until logout.
export async function syncPushDevice(token: string, userId: number) {
  if (!browserSupportsPush() || notificationPermission() !== 'granted' || isPushOptedOut()) return
  if (readLocal(PUSH_SYNCED_KEY) === String(userId)) return
  const info = await loadPushServerInfo()
  if (!info.enabled || !info.publicKey) return
  if (await registerPushDevice(token, info.publicKey)) writeLocal(PUSH_SYNCED_KEY, String(userId))
}
