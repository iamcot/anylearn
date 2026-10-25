// Hand-written service worker. ServiceWorkerRegister registers it as /sw.js?v=<build id>, so every build is a new
// worker; it waits until the person taps "Tải lại" (SKIP_WAITING) instead of swapping under an open page.
// Pages and API answers are never cached: they carry personal data (orders, schedules) and must stay fresh.
const params = new URL(self.location.href).searchParams
const CACHING_ENABLED = params.get('cache') !== '0'
const STATIC_CACHE = 'anylearn-static-v1'
const OFFLINE_CACHE = 'anylearn-offline-v1'
const OFFLINE_URL = '/offline.html'
const KNOWN_CACHES = [STATIC_CACHE, OFFLINE_CACHE]
const STATIC_PREFIXES = ['/_next/static/', '/icons/', '/cdn/']

self.addEventListener('install', (event) => {
  if (!CACHING_ENABLED) return
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => !KNOWN_CACHES.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

function isStaticAsset(url) {
  return STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

async function networkWithOfflinePage(request) {
  try {
    return await fetch(request)
  } catch {
    const offline = await caches.match(OFFLINE_URL)
    return offline || Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  if (!CACHING_ENABLED) return
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (request.mode === 'navigate') event.respondWith(networkWithOfflinePage(request))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((client) => client.url.startsWith(self.location.origin))
      if (existing) {
        existing.focus()
        return existing.navigate(url)
      }
      return self.clients.openWindow(url)
    }),
  )
})
