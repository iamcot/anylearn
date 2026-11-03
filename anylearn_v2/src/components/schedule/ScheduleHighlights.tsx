'use client'

import MissedBadge from './MissedBadge'
import StartDateChooser from './StartDateChooser'
import { ACTIVITY_LABELS } from '@/config/itemLabels'
import type { CalendarEvent, Enrollment } from '@/lib/schedule/calendar'
import { AlertIcon } from '@/components/icons'
import { eventColorClass, eventKey, pointOf, type SelectEvent } from './eventStyle'

interface PendingProps {
  enrollments: Enrollment[]
  onSetStartDate: (enrollmentId: number, date: string) => Promise<string | null>
}

export function PendingStartDates({ enrollments, onSetStartDate }: PendingProps) {
  if (enrollments.length === 0) return null

  return (
    <div className="rounded-[10px] border border-warn-line bg-warn-soft px-3.5 py-2.5">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-warn-text">Cần xử lý</div>
      {enrollments.map(enrollment => (
        <div key={enrollment.id} className="mb-3 last:mb-0">
          <div className="mb-2 flex items-start gap-2 text-[13px]">
            <AlertIcon className="mt-0.5 size-4 shrink-0 text-warn-text" />
            <span>
              <strong>{enrollment.itemTitle}</strong>{enrollment.learnerName ? ` (${enrollment.learnerName})` : ''} — Chọn ngày khai giảng
            </span>
          </div>
          <div className="rounded-xl bg-white p-3">
            <StartDateChooser enrollment={enrollment} onSave={onSetStartDate} />
          </div>
        </div>
      ))}
    </div>
  )
}

function UpcomingGroup({ title, events, onSelect }: { title: string; events: CalendarEvent[]; onSelect: SelectEvent }) {
  if (events.length === 0) return null
  return (
    <div className="mb-1.5 last:mb-0">
      <div className="mb-0.5 text-[11px] font-medium text-blue">{title}</div>
      {events.map(event => (
        <button key={eventKey(event)} type="button" onClick={mouse => onSelect(event, pointOf(mouse))}
          className="flex min-h-9 w-full cursor-pointer items-center gap-2 border-0 bg-transparent py-0.5 text-left text-[13px]">
          <span className={`size-2 shrink-0 rounded-full ${eventColorClass(event)}`} />
          {event.kind === 'activity' && <span className="text-[11px] font-medium text-activity">{ACTIVITY_LABELS[event.data.type]}</span>}
          <span className="font-medium text-ink">{event.data.itemTitle}</span>
          {event.kind === 'enrollment' && event.data.timeStart && <span className="text-[11px] text-muted">{event.data.timeStart}</span>}
          <MissedBadge event={event} />
        </button>
      ))}
    </div>
  )
}

export function UpcomingEvents({ today, tomorrow, onSelect }: { today: CalendarEvent[]; tomorrow: CalendarEvent[]; onSelect: SelectEvent }) {
  if (today.length === 0 && tomorrow.length === 0) return null
  return (
    <div className="rounded-[10px] border border-blue-line bg-blue-soft px-3.5 py-2.5">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-blue">Sắp diễn ra</div>
      <UpcomingGroup title="Hôm nay" events={today} onSelect={onSelect} />
      <UpcomingGroup title="Ngày mai" events={tomorrow} onSelect={onSelect} />
    </div>
  )
}
