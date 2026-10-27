'use client'

import { useEffect } from 'react'
import { listenForInstallPrompt } from './installPromptStore'

// One stable worker URL: the browser installs a new worker only when the bytes of sw.js change. Never version the URL
// per build: a page on an older bundle would re-register the old worker as an "update".
// In `next dev` caching is off (`cache=0`) so hot reload never serves old chunks; the worker still registers there
// because notifications need it.
function serviceWorkerUrl() {
  return process.env.NODE_ENV === 'production' ? '/sw.js' : '/sw.js?cache=0'
}

// The worker only caches content-hashed static files and powers push; pages and API answers are never cached. So a
// new worker is activated silently (sw.js calls skipWaiting on install) and there is no "new version" banner or
// reload. A worker left waiting by an older sw.js (which waited for a tap on "Tải lại") is told to activate here.
function activateWaiting(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed') installing.postMessage({ type: 'SKIP_WAITING' })
    })
  })
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    listenForInstallPrompt()
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register(serviceWorkerUrl(), { updateViaCache: 'none' })
      .then(activateWaiting)
      .catch(() => {})
  }, [])

  return null
}
