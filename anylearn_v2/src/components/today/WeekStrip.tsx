'use client'

import Link from 'next/link'
import { useState } from 'react'
import { dayLabel, formatClock, modeLabel, weekdayShort } from '@/lib/today/format'
import type { WeekDayView } from '@/lib/today/types'

function todayKey(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function DayList({ day, now }: { day: WeekDayView; now: Date }) {
  if (day.sessions.length === 0) {
    return <p className="mt-3 text-sm text-muted">{dayLabel(`${day.date}T00:00:00`, now)} không có buổi học.</p>
  }
  return (
    <ul className="mt-3 space-y-2">
      {day.sessions.map(session => (
        <li key={session.key} className="flex items-start justify-between gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
          <span className="font-semibold text-ink">{formatClock(session.startAt)} · {session.title}</span>
          <span className="shrink-0 text-xs font-bold text-muted">{modeLabel(session)}</span>
        </li>
      ))}
    </ul>
  )
}

export default function WeekStrip({ week, now }: { week: WeekDayView[]; now: Date }) {
  const today = todayKey(now)
  const [selected, setSelected] = useState(today)
  const selectedDay = week.find(day => day.date === selected) ?? week[0]

  return (
    <section className="rounded-[20px] border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Tuần này</span>
        <Link href="/account/schedule" className="text-sm font-bold text-blue">Xem lịch đầy đủ</Link>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {week.map(day => {
          const isSelected = day.date === selectedDay.date
          return (
            <button
              key={day.date} type="button" onClick={() => setSelected(day.date)} aria-pressed={isSelected}
              aria-label={`${weekdayShort(day.date)} ngày ${Number(day.date.slice(8))}`}
              className={`flex min-h-16 flex-col items-center justify-center rounded-xl py-2 ${isSelected ? 'border-green bg-green-soft text-green-dark border' : 'text-ink hover:bg-bg'}`}
            >
              <span className={`text-xs ${isSelected ? 'text-green-dark' : 'text-muted'}`}>{weekdayShort(day.date)}</span>
              <span className="text-sm font-black">{Number(day.date.slice(8))}</span>
              <span className="mt-1 flex h-1.5 gap-0.5" aria-hidden="true">
                {day.hasClass && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green'}`} />}
                {day.hasExtra && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 flex gap-3 text-xs text-muted">
        <span><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green" />Có lớp</span>
        <span><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />Ngoại khóa</span>
      </p>
      <DayList day={selectedDay} now={now} />
    </section>
  )
}
