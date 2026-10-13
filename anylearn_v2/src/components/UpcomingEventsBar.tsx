'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getUpcomingEvents, UpcomingEvent } from '@/lib/api'

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

const EXCLUDED = ['/checkout', '/order/', '/today']
const TODAY_HREF = '/today'

export default function UpcomingEventsBar() {
  const { user, token } = useAuth()
  const pathname = usePathname()
  const [events, setEvents] = useState<UpcomingEvent[]>([])

  useEffect(() => {
    if (!user || !token) return
    getUpcomingEvents(token).then(list => setEvents(list))
  }, [user, token])

  if (!user || events.length === 0) return null
  if (EXCLUDED.some(p => pathname.startsWith(p))) return null

  const ev = events[0]

  return (
    <div className="border-b-2 border-blue bg-blue-soft">
      <div className="container flex items-center gap-3 py-3">
        <Link href={TODAY_HREF} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 no-underline">
          <span className="shrink-0 whitespace-nowrap rounded-full border border-blue/40 bg-white px-3 py-1 text-sm font-black text-blue">
            📅 {fmtDate(ev.date)}{ev.time ? ` ${ev.time}` : ''}
          </span>
          <span className="min-w-0 flex-[1_1_9rem] truncate text-[15px] text-ink">
            {ev.label} · <strong className="font-black">{ev.itemTitle}</strong>
          </span>
        </Link>
        <Link
          href={TODAY_HREF}
          className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-blue px-5 text-[15px] font-black text-white no-underline hover:-translate-y-px transition"
        >
          Hôm nay của bạn
        </Link>
      </div>
    </div>
  )
}
