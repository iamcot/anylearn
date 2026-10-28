'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getUpcomingEvents, UpcomingEvent } from '@/lib/api'
import { formatRelativeDay } from '@/lib/format/date'
import { CalendarIcon } from './icons'

const EXCLUDED = ['/checkout', '/order/', '/today', '/fun', '/community']
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
          <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-blue/40 bg-white px-3 py-1 text-sm font-extrabold text-blue">
            <CalendarIcon className="size-4" />
            {formatRelativeDay(ev.date)}{ev.time ? ` ${ev.time}` : ''}
          </span>
          <span className="line-clamp-2 min-w-0 flex-[1_1_9rem] break-words text-[15px] leading-snug text-ink">
            {ev.label} · <strong className="font-extrabold">{ev.itemTitle}</strong>
          </span>
        </Link>
        <Link
          href={TODAY_HREF}
          className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-green px-4 text-[15px] font-extrabold text-white no-underline transition hover:-translate-y-px sm:px-5"
        >
          <span className="sm:hidden">Hôm nay</span>
          <span className="hidden sm:inline">Hôm nay của bạn</span>
        </Link>
      </div>
    </div>
  )
}
