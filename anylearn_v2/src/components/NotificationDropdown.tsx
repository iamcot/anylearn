'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getNotifications, markNotificationRead, markAllNotificationsRead, AppNotification } from '@/lib/api'

interface Props {
  token: string
  onClose: () => void
  onUnreadChange: (count: number) => void
}

const SKIP_TYPES = new Set(['sms', 'zalo'])

function resolveRoute(route?: string, extraContent?: string): string | null {
  if (!route) return null
  if (route.startsWith('/admin')) return null   // admin-only routes — not navigable on user frontend
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
    default:                  return null
  }
}

function typeIcon(type: string): string {
  switch (type) {
    case 'order':                return '🛒'
    case 'payment':              return '💳'
    case 'voucher_partner_sent': return '🎁'
    case 'system':
    case 'system_notif':         return '📢'
    default:                     return '🔔'
  }
}

function timeAgo(dateStr?: string | number[]): string {
  if (!dateStr) return ''
  try {
    const date = Array.isArray(dateStr)
      ? new Date(dateStr[0], dateStr[1] - 1, dateStr[2], dateStr[3] ?? 0, dateStr[4] ?? 0, dateStr[5] ?? 0)
      : new Date(dateStr as string)
    const diff = (Date.now() - date.getTime()) / 1000
    if (diff < 60)    return 'vừa xong'
    if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return `${Math.floor(diff / 86400)} ngày trước`
  } catch { return '' }
}

export default function NotificationDropdown({ token, onClose, onUnreadChange }: Props) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    getNotifications(token, 0).then(res => {
      setItems(res.items.filter(n => !SKIP_TYPES.has(n.type)))
      setLoading(false)
    })
  }, [token])

  function currentUnread(list: AppNotification[]) {
    return list.filter(n => !n.read).length
  }

  async function markRead(notif: AppNotification) {
    if (!notif.read) {
      await markNotificationRead(notif.id, token)
      const next = items.map(n => n.id === notif.id ? { ...n, read: new Date().toISOString() } : n)
      setItems(next)
      onUnreadChange(currentUnread(next))
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(token)
    const next = items.map(n => ({ ...n, read: n.read ?? new Date().toISOString() }))
    setItems(next)
    onUnreadChange(0)
  }

  async function handleClick(notif: AppNotification) {
    if (notif.type === 'voucher_partner_sent' && notif.extraContent === 'copy') {
      if (notif.route) {
        await navigator.clipboard.writeText(notif.route)
        setCopied(notif.id)
        setTimeout(() => setCopied(c => (c === notif.id ? null : c)), 2000)
      }
      await markRead(notif)
      return
    }

    await markRead(notif)

    const dest = resolveRoute(notif.route, notif.extraContent)
    if (dest) router.push(dest)
    onClose()
  }

  const visibleItems = items
  const hasUnread = visibleItems.some(n => !n.read)

  return (
    <div
      className="absolute right-0 top-full mt-2 w-96 bg-white border border-[#e6edf4] rounded-[18px] shadow-[0_12px_40px_rgba(15,23,42,0.14)] overflow-hidden z-50">

      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e6edf4]">
        <span className="font-black text-[#17212f] text-sm">Thông báo</span>
        {hasUnread && (
          <button type="button" onClick={handleMarkAllRead}
            className="text-xs text-blue hover:underline font-black">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="max-h-[480px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f0f5fa] flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#f0f5fa] rounded-lg w-3/4" />
                  <div className="h-2.5 bg-[#f0f5fa] rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="py-10 text-center text-[#6d7a8a] text-sm">
            <div className="text-3xl mb-2">🔔</div>
            Chưa có thông báo nào
          </div>
        ) : (
          visibleItems.map(notif => {
            const isCopyVoucher = notif.type === 'voucher_partner_sent' && notif.extraContent === 'copy'
            const isUnread = !notif.read
            const hasDest = isCopyVoucher || !!resolveRoute(notif.route, notif.extraContent)

            return (
              <button key={notif.id} onClick={() => handleClick(notif)}
                className={`w-full text-left px-4 py-3 flex gap-3 border-b border-[#f0f5fa] last:border-0 transition-colors ${
                  isUnread ? 'bg-[#f0f7ff] hover:bg-[#e8f3ff]' : 'hover:bg-[#f7fafc]'
                } ${hasDest ? 'cursor-pointer' : 'cursor-default'}`}>
                <div className={`w-9 h-9 rounded-full flex-shrink-0 grid place-items-center text-lg ${isUnread ? 'bg-[#dbeeff]' : 'bg-[#f0f5fa]'}`}>
                  {isCopyVoucher ? '📋' : typeIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  {notif.title && (
                    <p className={`text-[13px] font-black mb-0.5 ${isUnread ? 'text-blue' : 'text-[#17212f]'}`}>
                      {notif.title}
                    </p>
                  )}
                  <p className="text-[13px] text-[#374151] leading-snug whitespace-pre-wrap break-words">
                    {notif.content}
                  </p>
                  {isCopyVoucher && notif.route && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <code className="bg-[#f0f5fa] text-[#00539b] text-[12px] font-black px-2 py-0.5 rounded-lg">
                        {notif.route}
                      </code>
                      <span className="text-[11px] text-[#00a651] font-black">
                        {copied === notif.id ? '✓ Đã sao chép' : 'Nhấn để sao chép'}
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] text-[#9db4c8] mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                {isUnread && <div className="w-2 h-2 rounded-full bg-blue flex-shrink-0 mt-1.5" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
