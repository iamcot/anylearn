'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getCourseUrl } from '@/lib/api'
import { ACTIVITY_LABELS, WEEKDAY_LABELS } from '@/config/itemLabels'
import type { CalendarEvent, Enrollment } from '@/lib/schedule/calendar'
import ChevronLabel from '@/components/ChevronLabel'
import OrderItemRating from '@/components/OrderItemRating'
import { CloseIcon } from '@/components/icons'

const POPOVER_WIDTH = 360
const POPOVER_MARGIN = 8
const MIN_SPACE_BELOW = 240
const DESKTOP_MIN_WIDTH = 768

interface Props {
  event: CalendarEvent
  position: { x: number; y: number }
  onClose: () => void
  onCancelActivity: (id: number) => void
  /** 'markable' shows the "Đã đến lớp" button, 'attended' the tick; onMarkAttended resolves to an error text or null. */
  attendance?: 'none' | 'attended' | 'markable'
  onMarkAttended?: () => Promise<string | null>
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <span className="w-[70px] shrink-0 text-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  )
}

const formatDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN')

function EnrollmentDetails({ enrollment }: { enrollment: Enrollment }) {
  const weekdays = enrollment.weekdays?.split(',').map(day => WEEKDAY_LABELS[day.trim()] ?? day.trim()).join(', ')
  const time = enrollment.timeStart ? `${enrollment.timeStart}${enrollment.timeEnd ? `–${enrollment.timeEnd}` : ''}` : null
  const from = enrollment.startDate ?? enrollment.dateStart
  const billingOnly = !enrollment.scheduleType

  return (
    <>
      {billingOnly && enrollment.startDate && (
        <DetailRow label="Hiệu lực">
          <span className="font-medium">
            {formatDay(enrollment.startDate)}{enrollment.endDate ? ` → ${formatDay(enrollment.endDate)}` : ''}
          </span>
        </DetailRow>
      )}
      {(weekdays || time) && <DetailRow label="Lịch học"><span className="font-medium">{[weekdays, time].filter(Boolean).join(' · ')}</span></DetailRow>}
      {!billingOnly && from && (
        <DetailRow label="Từ ngày">{formatDay(from)}{enrollment.dateEnd ? ` → ${formatDay(enrollment.dateEnd)}` : ''}</DetailRow>
      )}
      {enrollment.scheduleTitle && <DetailRow label="Ca học">{enrollment.scheduleTitle}</DetailRow>}
      {enrollment.locationNote && <DetailRow label="Địa điểm">{enrollment.locationNote}</DetailRow>}
    </>
  )
}

export default function EventPopup({ event, position, onClose, onCancelActivity, attendance = 'none', onMarkAttended }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [marking, setMarking] = useState(false)
  const [markError, setMarkError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const activity = event.kind === 'activity' ? event.data : null
  const isDesktop = window.innerWidth >= DESKTOP_MIN_WIDTH

  const left = Math.min(Math.max(position.x - POPOVER_WIDTH / 2, POPOVER_MARGIN), window.innerWidth - POPOVER_WIDTH - POPOVER_MARGIN)
  const below = window.innerHeight - position.y - 16 >= MIN_SPACE_BELOW
  const placement = isDesktop
    ? { left, width: POPOVER_WIDTH, ...(below ? { top: position.y + 10 } : { bottom: window.innerHeight - position.y + 10 }) }
    : undefined

  const courseUrl = getCourseUrl({ id: event.data.itemId, seoUrl: event.data.seoUrl, title: event.data.itemTitle })

  return (
    <>
      <div className="fixed inset-0 z-[1999] bg-ink/30 md:bg-transparent" onClick={onClose} />
      <div
        role="dialog"
        aria-label={event.data.itemTitle}
        style={placement}
        className="fixed inset-x-0 bottom-0 z-[2000] rounded-t-[20px] bg-white p-[18px] pb-[calc(18px+env(safe-area-inset-bottom))] shadow-raised md:inset-x-auto md:bottom-auto md:rounded-[14px] md:pb-[18px]"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            {activity && (
              <span className="mb-1 inline-block rounded-full bg-activity px-2 py-0.5 text-[11px] font-medium text-white">
                {ACTIVITY_LABELS[activity.type] ?? activity.type}
              </span>
            )}
            <div className="text-[15px] font-medium leading-[1.3] text-ink">{event.data.itemTitle}</div>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="-mr-2 -mt-2 grid size-11 shrink-0 cursor-pointer place-items-center border-0 bg-transparent text-muted hover:text-ink">
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-col gap-[7px] text-[13px]">
          {event.data.learnerName && <DetailRow label="Người học">{event.data.learnerName}</DetailRow>}
          {event.kind === 'enrollment' && <EnrollmentDetails enrollment={event.data} />}
          {activity?.date && <DetailRow label="Ngày">{activity.date}</DetailRow>}
          {activity?.note && <DetailRow label="Ghi chú">{activity.note}</DetailRow>}
          {event.kind === 'enrollment' && event.date && <DetailRow label="Ngày học">{formatDay(event.date)}</DetailRow>}
        </div>

        {attendance === 'attended' && <p className="mb-0 mt-3 text-[13px] font-bold text-green-dark">✓ Đã đến lớp</p>}
        {attendance === 'markable' && onMarkAttended && (
          <div className="mt-3">
            <button type="button" disabled={marking}
              onClick={async () => { setMarking(true); setMarkError(''); const error = await onMarkAttended(); setMarking(false); if (error) setMarkError(error) }}
              className="min-h-11 w-full cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-bold text-green-dark hover:bg-bg disabled:opacity-60">
              {marking ? 'Đang lưu...' : 'Đánh dấu đã đến lớp'}
            </button>
            {markError && <p className="mb-0 mt-2 text-xs text-red">{markError}</p>}
          </div>
        )}

        {event.kind === 'enrollment' && <OrderItemRating itemId={event.data.itemId} />}

        <div className="mt-4 flex items-center justify-between gap-2">
          {activity ? (
            confirming ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">Xác nhận hủy?</span>
                <button type="button" onClick={() => { setCancelling(true); onCancelActivity(activity.id) }} disabled={cancelling}
                  className="min-h-9 cursor-pointer rounded-full border-0 bg-red px-3 text-xs font-medium text-white">
                  {cancelling ? '...' : 'Hủy'}
                </button>
                <button type="button" onClick={() => setConfirming(false)}
                  className="min-h-9 cursor-pointer rounded-full border border-line bg-transparent px-3 text-xs text-muted">Thôi</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)}
                className="min-h-9 cursor-pointer rounded-full border border-red-line bg-transparent px-3 text-xs text-red">
                Hủy đăng ký
              </button>
            )
          ) : <span />}
          <Link href={courseUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-green-dark no-underline">
            <ChevronLabel>Xem khóa học</ChevronLabel>
          </Link>
        </div>
      </div>
    </>
  )
}
