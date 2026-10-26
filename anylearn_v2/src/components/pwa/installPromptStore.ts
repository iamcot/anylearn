// Chrome fires `beforeinstallprompt` once, early, on any page. Keep it here so a card mounted later can still use it.
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let listening = false
const subscribers = new Set<() => void>()

function notify() {
  subscribers.forEach(callback => callback())
}

export function listenForInstallPrompt() {
  if (listening) return
  listening = true
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function subscribeInstallPrompt(callback: () => void) {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}

export function getInstallPrompt() {
  return deferredPrompt
}

export async function showInstallPrompt(): Promise<boolean> {
  const event = deferredPrompt
  if (!event) return false
  deferredPrompt = null
  notify()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome === 'accepted'
}
