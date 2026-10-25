'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getNotifications } from '@/lib/api'
import { API_BASE } from '@/lib/apiBase'

export function useNotifications() {
  const { user, refreshUser } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  // Register service worker for reliable browser notifications (Chrome requires this)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Request browser notification permission when user logs in
  useEffect(() => {
    if (!user) return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [user])

  // SSE for real-time notifications + browser push
  useEffect(() => {
    if (!user) return
    getNotifications(user.jwtToken).then(({ unread }) => setUnreadCount(unread ?? 0))

    const es = new EventSource(`${API_BASE}/user/notification/stream?api_token=${user.apiToken}`)

    es.addEventListener('notification', async () => {
      const result = await getNotifications(user.jwtToken)
      setUnreadCount(result.unread ?? 0)

      // Refresh wallet_c and user profile so anyPoint balance is up to date
      refreshUser()

      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const latest = result.items.find(n => !n.read && n.type !== 'sms' && n.type !== 'zalo')
      if (!latest) return
      const opts = {
        body: latest.content,
        icon: `${window.location.origin}/favicon-16x16.png`,
        tag: `notif-${latest.id}`,
        requireInteraction: true,
        data: { url: `${window.location.origin}/` },
      }
      try {
        const reg = await navigator.serviceWorker?.ready
        if (reg) await reg.showNotification(latest.title || 'anyLEARN', opts)
        else new Notification(latest.title || 'anyLEARN', opts)
      } catch {
        new Notification(latest.title || 'anyLEARN', opts)
      }
    })

    return () => es.close()
  }, [user, refreshUser])

  return { unreadCount: user ? unreadCount : 0, setUnreadCount }
}
