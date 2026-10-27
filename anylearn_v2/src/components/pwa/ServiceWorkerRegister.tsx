'use client'

import { useEffect, useState } from 'react'
import { listenForInstallPrompt } from './installPromptStore'

// One stable worker URL. A per-build URL (`/sw.js?v=<build id>`) made every page register "its" worker: a page still
// running an older bundle (iOS PWA resumed from memory, another tab) registered the old URL as an update over the
// newer worker, and the next page registered the newer one again, so "anyLEARN có bản mới" came back after every
// "Tải lại". With a fixed URL the browser only installs a new worker when the bytes of sw.js change.
// In `next dev` caching is off (`cache=0`) so hot reload never serves old chunks; the worker still registers there
// because notifications need it.
function serviceWorkerUrl() {
  return process.env.NODE_ENV === 'production' ? '/sw.js' : '/sw.js?cache=0'
}

function watchForUpdate(registration: ServiceWorkerRegistration, onUpdate: (worker: ServiceWorker) => void) {
  if (registration.waiting && navigator.serviceWorker.controller) onUpdate(registration.waiting)
  registration.addEventListener('updatefound', () => {
    const installing = registration.installing
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) onUpdate(installing)
    })
  })
}

// The first install also fires `controllerchange` (clients.claim), so only reload when the person asked for the update.
let updateRequested = false
let reloading = false
const RELOAD_GUARD_KEY = 'anylearn-sw-reload-at'

function reloadOnce() {
  if (reloading) return
  reloading = true
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()))
  } catch {}
  window.location.reload()
}

// A reload we triggered less than 10 s ago: do not offer the banner again right away (guards against loops).
function justReloaded() {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_GUARD_KEY))
    return Number.isFinite(at) && Date.now() - at < 10_000
  } catch {
    return false
  }
}

async function applyUpdate(fallback: ServiceWorker) {
  updateRequested = true
  // The worker shown in the banner may have been replaced by a newer one since; tell the current waiting one.
  const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined)
  const worker = registration?.waiting ?? fallback
  worker.postMessage({ type: 'SKIP_WAITING' })
  // Safari sometimes never fires `controllerchange`; reload anyway so the button always does something.
  window.setTimeout(reloadOnce, 3000)
}

export default function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    listenForInstallPrompt()
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register(serviceWorkerUrl(), { updateViaCache: 'none' })
      .then(registration => {
        if (justReloaded()) {
          // Already reloaded for an update: activate anything still waiting silently instead of asking again.
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
          return
        }
        watchForUpdate(registration, setWaitingWorker)
      })
      .catch(() => {})

    const onControllerChange = () => {
      if (updateRequested) reloadOnce()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }, [])

  if (!waitingWorker) return null
  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[2100] mx-auto flex max-w-[420px] items-center gap-3 rounded-2xl bg-navy p-3 pl-4 text-white shadow-raised"
    >
      <p className="m-0 flex-1 text-sm font-medium">anyLEARN có bản mới</p>
      <button
        type="button"
        onClick={() => {
          setWaitingWorker(null)
          void applyUpdate(waitingWorker)
        }}
        className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-medium text-white"
      >
        Tải lại
      </button>
    </div>
  )
}
