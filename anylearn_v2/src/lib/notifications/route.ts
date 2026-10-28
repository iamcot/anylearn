// Notifications carry the route names of the old portal app; this maps them to pages of this site.
// Used by the bell dropdown and by /notifications/open (where push notifications land).
export function resolveNotificationRoute(route?: string | null, extraContent?: string | null): string | null {
  if (!route) return null
  if (route.startsWith('/admin')) return null
  switch (route) {
    case '/pdp':              return extraContent ? `/class/${extraContent}/khoa-hoc` : null
    case '/account':
    case '/account/edit':     return '/account/profile'
    case '/account/calendar': return '/account/schedule'
    case '/account/friends':
    case '/transaction':
    case '/foundation':       return '/account/anypoint'
    case '/orders':           return '/account/orders'
    case '/article':          return extraContent ? `/article/${extraContent}/bai-viet.html` : '/article'
    default:
      // Routes that already are pages of this site (the backend sends /account/schedule, /order/12, /today?child=3 ...).
      return route.startsWith('/account/') || route.startsWith('/order/') || route === '/today' || route.startsWith('/today?') || route.startsWith('/fun') || route.startsWith('/community') || route.startsWith('/today/fun') || route.startsWith('/today/community') ? route : null
  }
}

// Same format as the service worker builds in public/sw.js (keep both in step).
export function notificationOpenUrl(id: number | null | undefined, route?: string | null, extraContent?: string | null): string {
  const params = new URLSearchParams()
  if (id != null) params.set('id', String(id))
  if (route) params.set('route', route)
  if (extraContent) params.set('extra', extraContent)
  const query = params.toString()
  return query ? `/notifications/open?${query}` : '/notifications/open'
}
