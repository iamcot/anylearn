'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getUpcomingEvents, UpcomingEvent, getCourseUrl } from '@/lib/api'

const TODAY = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const TOMORROW = () => {
  const d = new Date(); d.setDate(d.getDate()+1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function fmtDate(iso: string) {
  const today = TODAY(); const tom = TOMORROW()
  if (iso === today) return 'Hôm nay'
  if (iso === tom) return 'Ngày mai'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

const EXCLUDED = ['/checkout', '/order/']

export default function UpcomingEventsBar() {
  const { user, token } = useAuth()
  const pathname = usePathname()
  const [events, setEvents] = useState<UpcomingEvent[]>([])

  useEffect(() => {
    if (!user || !token) return
    getUpcomingEvents(token).then(list => setEvents(list))
  }, [user, token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || events.length === 0) return null
  if (EXCLUDED.some(p => pathname.startsWith(p))) return null

  const ev = events[0]
  const href = ev.itemId
    ? getCourseUrl({ id: ev.itemId, seoUrl: ev.seoUrl, title: ev.itemTitle })
    : '/account/schedule'

  return (
    <div style={{ background: '#fff7ed', borderBottom: '1.5px solid #fb923c', padding: '7px 0' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>

        {/* prefix label */}
        <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', flexShrink: 0, whiteSpace: 'nowrap' }}>
          📅 
        </span>

        {/* event — flex: 1, two-line on mobile via flex-col, single-line on desktop */}
        <Link href={href} style={{ flex: 1, minWidth: 0, textDecoration: 'none', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px 6px' }}>
          {/* date+time chip — never wraps */}
          <span style={{
            background: '#fed7aa', borderRadius: 10, padding: '2px 8px',
            fontSize: 12, fontWeight: 600, color: '#9a3412', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {fmtDate(ev.date)}{ev.time ? ` ${ev.time}` : ''}
          </span>
          {/* label + title — wraps to new line if no room */}
          <span style={{ fontSize: 12, color: '#92400e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '1 1 120px' }}>
            {ev.label} · <strong style={{ fontWeight: 600 }}>{ev.itemTitle}</strong>
          </span>
        </Link>

        {/* view all */}
        <Link href="/account/schedule" style={{
          fontSize: 12, color: '#ea580c', fontWeight: 600, flexShrink: 0,
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          Xem lịch →
        </Link>
      </div>
    </div>
  )
}
