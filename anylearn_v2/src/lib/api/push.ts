import { apiFetch, authFetch } from './client'

export interface PushServerInfo {
  enabled: boolean
  publicKey: string | null
}

export interface PushDevice {
  endpoint: string
  keys: { p256dh: string; auth: string }
  platform: string
  standalone: boolean
}

export async function getPushServerInfo(): Promise<PushServerInfo> {
  const data = await apiFetch<PushServerInfo>('/push/public-key', { cache: 'no-store' })
  return data ?? { enabled: false, publicKey: null }
}

export async function subscribePushDevice(device: PushDevice, token: string) {
  return authFetch('/push/subscribe', token, { method: 'POST', body: JSON.stringify(device) })
}

export async function unsubscribePushDevice(endpoint: string, token: string) {
  return authFetch('/push/unsubscribe', token, { method: 'POST', body: JSON.stringify({ endpoint }) })
}

export async function sendTestPush(token: string) {
  return authFetch<{ delivered: number }>('/push/test', token, { method: 'POST' })
}
