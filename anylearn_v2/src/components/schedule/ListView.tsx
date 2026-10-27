import MissedBadge from './MissedBadge'
import { useMemo } from 'react'
import { eventsOnDate, toISO, type Activity, type CalendarEvent, type Enrollment } from '@/lib/schedule/calendar'
import { ACTIVITY_LABELS } from '@/config/itemLabels'
import { eventColorClass, eventKey, pointOf, type SelectEvent } from './eventStyle'

interface Props {
  enrollments: Enrollment[]
  activities: Activity[]
  from: string
  to: string
  onSelect: SelectEvent
}

function ListRow({ event, onSelect }: { event: CalendarEvent; onSelect: SelectEvent }) {
  const time = event.kind === 'enrollment' && (event.data.timeStart || event.data.timeEnd)
    ? `${event.data.timeStart ?? ''}${event.data.timeEnd ? `–${event.data.timeEnd}` : ''}`
    : null
  return (
    <button type="button" onClick={mouse => onSelect(event, pointOf(mouse))}
      className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent py-1.5 pl-1 text-left">
      <span className={`size-2.5 shrink-0 rounded-full ${eventColorClass(event)}`} />
      {event.kind === 'activity' && <span className="shrink-0 text-xs font-medium text-activity">{ACTIVITY_LABELS[event.data.type] ?? event.data.type}</span>}
      <span className="flex-1 text-sm font-medium text-ink">{event.data.itemTitle}</span>
      <MissedBadge event={event} />
      {time && <span className="shrink-0 text-xs text-subtle">{time}</span>}
    </button>
  )
}

export default function ListView({ enrollments, activities, from, to, onSelect }: Props) {
  const days = useMemo(() => {
    const result: { iso: string; events: CalendarEvent[] }[] = []
    const end = new Date(`${to}T00:00:00`)
    for (const date = new Date(`${from}T00:00:00`); date <= end; date.setDate(date.getDate() + 1)) {
      const iso = toISO(date)
      const events = eventsOnDate(enrollments, activities, iso)
      if (events.length) result.push({ iso, events })
    }
    return result
  }, [enrollments, activities, from, to])

  if (days.length === 0) return <div className="py-10 text-center text-[13px] text-muted">Không có hoạt động nào trong kỳ này.</div>

  return (
    <div>
      {days.map(({ iso, events }) => {
        const label = new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long' })
        return (
          <div key={iso} className="border-b border-line pb-1">
            <div className="pb-1.5 pt-2.5 text-xs font-medium text-muted">{label.charAt(0).toUpperCase() + label.slice(1)}</div>
            {events.map(event => <ListRow key={eventKey(event)} event={event} onSelect={onSelect} />)}
          </div>
        )
      })}
    </div>
  )
}
