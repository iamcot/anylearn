'use client'

import MissedBadge from './MissedBadge'
import { useState } from 'react'
import { eventsOnDate, toISO, type Activity, type CalendarEvent, type Enrollment } from '@/lib/schedule/calendar'
import EventChip from './EventChip'
import { eventColorClass, eventKey, eventLabel, pointOf, type SelectEvent } from './eventStyle'

const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const MAX_DOTS = 3

interface Props {
  enrollments: Enrollment[]
  activities: Activity[]
  year: number
  month: number // 0-indexed
  today: string
  onSelect: SelectEvent
}

function DayEvents({ events, onSelect }: { events: CalendarEvent[]; onSelect: SelectEvent }) {
  // Desktop: show chips, fewer when the day is crowded.
  const shown = events.length <= 2 ? events : events.slice(0, 1)
  return (
    <div className="hidden flex-col gap-px md:flex">
      {shown.map(event => <EventChip key={eventKey(event)} event={event} onSelect={onSelect} />)}
      {events.length > 2 && <span className="pl-1 text-[10px] text-muted">+{events.length - 1} nữa</span>}
    </div>
  )
}

function DayDots({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="mt-1 flex justify-center gap-0.5 md:hidden">
      {events.slice(0, MAX_DOTS).map(event => <span key={eventKey(event)} className={`size-1.5 rounded-full ${eventColorClass(event)}`} />)}
    </div>
  )
}

function DayAgenda({ events, onSelect }: { events: CalendarEvent[]; onSelect: SelectEvent }) {
  if (events.length === 0) return <p className="m-0 py-3 text-center text-[13px] text-muted">Không có hoạt động nào trong ngày này.</p>
  return (
    <div className="flex flex-col">
      {events.map(event => (
        <button key={eventKey(event)} type="button" onClick={mouse => onSelect(event, pointOf(mouse))}
          className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-1 text-left">
          <span className={`size-2.5 shrink-0 rounded-full ${eventColorClass(event)}`} />
          <span className="flex-1 text-sm font-medium text-ink">{eventLabel(event)}</span>
          <MissedBadge event={event} />
        </button>
      ))}
    </div>
  )
}

export default function MonthView({ enrollments, activities, year, month, today, onSelect }: Props) {
  const inThisMonth = today.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
  const [selectedDay, setSelectedDay] = useState<string | null>(inThisMonth ? today : null)

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7

  return (
    <div>
      <div className="grid grid-cols-7 gap-px">
        {WEEKDAY_HEADERS.map(day => (
          <div key={day} className="border-b border-line py-1 text-center text-[11px] font-medium text-subtle">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px border border-t-0 border-line bg-line">
        {Array.from({ length: totalCells }, (_, index) => {
          const dayNumber = index - offset + 1
          if (dayNumber < 1 || dayNumber > daysInMonth) return <div key={index} className="min-h-14 bg-bg md:min-h-20" />

          const iso = toISO(new Date(year, month, dayNumber))
          const events = eventsOnDate(enrollments, activities, iso)
          const isToday = iso === today
          return (
            <div key={iso} className={`min-h-14 p-1 md:min-h-20 md:px-[3px] md:pb-[3px] ${iso === selectedDay ? 'bg-blue-soft md:bg-white' : 'bg-white'}`}>
              <button
                type="button"
                onClick={() => setSelectedDay(iso)}
                aria-label={`Ngày ${dayNumber}`}
                className={`mx-auto grid size-7 cursor-pointer place-items-center rounded-full border-0 text-xs md:mx-0 md:mb-0.5 md:size-[22px] md:cursor-default ${
                  isToday ? 'bg-event-1 font-medium text-white' : 'bg-transparent text-text'
                }`}
              >
                {dayNumber}
              </button>
              <DayDots events={events} />
              <DayEvents events={events} onSelect={onSelect} />
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <div className="mt-3 border-t border-line pt-2 md:hidden">
          <div className="mb-1 text-xs font-medium text-muted">
            {new Date(`${selectedDay}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          </div>
          <DayAgenda events={eventsOnDate(enrollments, activities, selectedDay)} onSelect={onSelect} />
        </div>
      )}
    </div>
  )
}
