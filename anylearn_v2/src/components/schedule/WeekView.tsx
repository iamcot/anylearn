import { eventsOnDate, toISO, type Activity, type Enrollment } from '@/lib/schedule/calendar'
import EventChip from './EventChip'
import { eventKey, type SelectEvent } from './eventStyle'

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

interface Props {
  enrollments: Enrollment[]
  activities: Activity[]
  weekStart: Date
  today: string
  onSelect: SelectEvent
}

// One column per day on desktop; days stack on a phone.
export default function WeekView({ enrollments, activities, weekStart, today, onSelect }: Props) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + index)
    return day
  })

  return (
    <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-7">
      {days.map(day => {
        const iso = toISO(day)
        const isToday = iso === today
        return (
          <div key={iso} className="flex flex-col bg-white md:min-h-[300px]">
            <div className={`flex items-center justify-center gap-2 border-b border-line px-1.5 py-1.5 md:flex-col md:gap-0 ${isToday ? 'bg-blue-soft' : 'bg-bg'}`}>
              <div className="text-[11px] font-medium text-subtle">{WEEKDAY_SHORT[day.getDay()]}</div>
              <div className={`text-base font-medium ${isToday ? 'text-event-1' : 'text-text'}`}>{day.getDate()}</div>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-1">
              {eventsOnDate(enrollments, activities, iso).map(event => (
                <EventChip key={eventKey(event)} event={event} onSelect={onSelect} wrap />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
