import { isDismissedRecently, type Platform } from './installPrompt'

// ask: show "Bật thông báo". needs-install: iPhone only gets push inside the installed app.
// granted / denied: the browser already decided. unsupported: no push here (or the server has no keys).
export type PushPromptMode = 'unsupported' | 'needs-install' | 'ask' | 'granted' | 'denied' | 'hidden'

export interface PushPromptState {
  serverEnabled: boolean
  browserSupportsPush: boolean
  permission: NotificationPermission
  platform: Platform
  standalone: boolean
  dismissedAt: string | null
  now: Date
  dismissDays: number
}

export function pushPromptMode(state: PushPromptState): PushPromptMode {
  if (!state.serverEnabled) return 'unsupported'
  if (state.platform === 'ios' && !state.standalone) return 'needs-install'
  if (!state.browserSupportsPush) return 'unsupported'
  if (state.permission === 'granted') return 'granted'
  if (state.permission === 'denied') return 'denied'
  if (isDismissedRecently(state.dismissedAt, state.now, state.dismissDays)) return 'hidden'
  return 'ask'
}

// The VAPID public key is base64url; pushManager.subscribe wants the raw bytes.
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}
