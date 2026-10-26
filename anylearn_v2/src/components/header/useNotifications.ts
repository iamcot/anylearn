'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getNotifications } from '@/lib/api'
import { API_BASE } from '@/lib/apiBase'
import { notificationOpenUrl } from '@/lib/notifications/route'
import { syncPushDevice } from '@/components/pwa/pushDevice'

// Number on the installed app icon (Android, desktop, iOS 16.4+ home screen apps).
function showAppBadge(unread: number) {
  const nav = navigator as Navigator & { setAppBadge?: (count: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
  const update = unread > 0 ? nav.setAppBadge?.(unread) : nav.clearAppBadge?.()
  update?.catch(() => {})
}

export function useNotifications() {
  const { user, refreshUser } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const jwtToken = user?.jwtToken
  const apiToken = user?.apiToken
  const userId = user?.id

  // Permission is asked from the "Bật thông báo" cards, never at login. If it was granted before, register this device.
  useEffect(() => {
    if (!jwtToken || !userId) return
    void syncPushDevice(jwtToken, userId)
  }, [jwtToken, userId])

  // SSE for real-time notifications while a tab is open (Web Push covers the closed app)

  useEffect(() => {
    if (!jwtToken || !apiToken) return
    const loadUnread = () => getNotifications(jwtToken).then(({ unread }) => {
      setUnreadCount(unread ?? 0)
      showAppBadge(unread ?? 0)
    })
    loadUnread()

    const es = new EventSource(`${API_BASE}/user/notification/stream?api_token=${apiToken}`)

    // The server says "connected" on every (re)connection: events sent while offline are not replayed, so recount.
    es.addEventListener('connected', loadUnread)

    const recountWhenVisible = () => { if (!document.hidden) loadUnread() }
    document.addEventListener('visibilitychange', recountWhenVisible)

    es.addEventListener('notification', async () => {
      const result = await getNotifications(jwtToken)
      setUnreadCount(result.unread ?? 0)
      showAppBadge(result.unread ?? 0)

      // Refresh wallet_c and user profile so anyPoint balance is up to date
      refreshUser()

      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const latest = result.items.find(n => !n.read && n.type !== 'sms' && n.type !== 'zalo')
      if (!latest) return
      const opts = {
        body: latest.content,
        icon: `${window.location.origin}/icons/icon-192.png`,
        badge: `${window.location.origin}/icons/badge-96.png`,
        tag: `notif-${latest.id}`,
        requireInteraction: true,
        data: { url: notificationOpenUrl(latest.id, latest.route, latest.extraContent) },
      }
      try {
        const reg = await navigator.serviceWorker?.ready
        if (reg) await reg.showNotification(latest.title || 'anyLEARN', opts)
        else new Notification(latest.title || 'anyLEARN', opts)
      } catch {
        new Notification(latest.title || 'anyLEARN', opts)
      }
    })

    return () => {
      es.close()
      document.removeEventListener('visibilitychange', recountWhenVisible)
    }
  }, [jwtToken, apiToken, refreshUser])

  return { unreadCount: user ? unreadCount : 0, setUnreadCount }
}
