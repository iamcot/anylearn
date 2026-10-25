'use client'

import { useState } from 'react'
import { ACTIVITY_LABELS } from '@/config/itemLabels'
import type { CalendarEvent, Enrollment } from '@/lib/schedule/calendar'
import { AlertIcon } from '@/components/icons'
import { eventColorClass, eventKey, pointOf, type SelectEvent } from './eventStyle'

interface PendingProps {
  enrollments: Enrollment[]
  onSetStartDate: (enrollmentId: number, date: string) => Promise<void>
}

export function PendingStartDates({ enrollments, onSetStartDate }: PendingProps) {
  const [dates, setDates] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  if (enrollments.length === 0) return null

  const save = async (id: number) => {
    const date = dates[id]
    if (!date) return
    setSavingId(id)
    await onSetStartDate(id, date)
    setSavingId(null)
  }

  return (
    <div className="rounded-[10px] border border-warn-line bg-warn-soft px-3.5 py-2.5">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-warn-text">Cần xử lý</div>
      {enrollments.map(enrollment => (
        <div key={enrollment.id} className="mb-2 last:mb-0">
          <div className="mb-1 flex items-start gap-2 text-[13px]">
            <AlertIcon className="mt-0.5 size-4 shrink-0 text-warn-text" />
            <span><strong>{enrollment.itemTitle}</strong> — Chọn ngày khai giảng</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <input
              type="date"
              value={dates[enrollment.id] ?? ''}
              onChange={event => setDates(prev => ({ ...prev, [enrollment.id]: event.target.value }))}
              aria-label={`Ngày khai giảng ${enrollment.itemTitle}`}
              className="min-h-11 rounded-lg border border-line bg-white px-2 text-xs"
            />
            <button
              type="button"
              onClick={() => save(enrollment.id)}
              disabled={!dates[enrollment.id] || savingId === enrollment.id}
              className="min-h-11 cursor-pointer rounded-full border-0 bg-blue px-4 text-xs font-medium text-white disabled:opacity-50"
            >
              {savingId === enrollment.id ? '...' : 'Xác nhận'}
            </button>
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
