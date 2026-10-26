'use client'

import { useEffect, useState } from 'react'
import { listenForInstallPrompt } from './installPromptStore'

// Each build registers a new worker URL. In `next dev` caching is off (`cache=0`) so hot reload never serves old chunks;
// the worker still registers there because notifications need it.
function serviceWorkerUrl() {
  const isProduction = process.env.NODE_ENV === 'production'
  const version = encodeURIComponent(process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev')
  return `/sw.js?v=${version}${isProduction ? '' : '&cache=0'}`
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

function applyUpdate(worker: ServiceWorker) {
  updateRequested = true
  worker.postMessage({ type: 'SKIP_WAITING' })
}

export default function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    listenForInstallPrompt()
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register(serviceWorkerUrl())
      .then(registration => watchForUpdate(registration, setWaitingWorker))
      .catch(() => {})

    let reloading = false
    const reloadOnce = () => {
      if (!updateRequested || reloading) return
      reloading = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', reloadOnce)
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
        onClick={() => applyUpdate(waitingWorker)}
        className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-medium text-white"
      >
        Tải lại
      </button>
    </div>
  )
}
