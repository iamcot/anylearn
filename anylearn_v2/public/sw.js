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

// Same URL format as notificationOpenUrl in src/lib/notifications/route.ts: that page marks the notification read
// and maps the portal route to a page of the site.
function notificationOpenUrl(data) {
  const params = new URLSearchParams()
  if (data.notificationId != null) params.set('id', String(data.notificationId))
  if (data.route) params.set('route', data.route)
  if (data.extraContent) params.set('extra', data.extraContent)
  const query = params.toString()
  return query ? `/notifications/open?${query}` : '/notifications/open'
}

function readPushData(event) {
  if (!event.data) return {}
  try {
    return event.data.json()
  } catch {
    return { body: event.data.text() }
  }
}

// Always show something: Safari revokes push permission from sites that receive pushes silently.
// An open tab shows the same notification (same tag) from its own live connection, so the two replace each other.
self.addEventListener('push', (event) => {
  const data = readPushData(event)
  const badge = typeof data.unread === 'number' && self.navigator.setAppBadge
    ? self.navigator.setAppBadge(data.unread).catch(() => {})
    : Promise.resolve()
  const shown = self.registration.showNotification(data.title || 'anyLEARN', {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag || undefined,
    data: { url: notificationOpenUrl(data) },
  })
  event.waitUntil(Promise.all([badge, shown]))
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
