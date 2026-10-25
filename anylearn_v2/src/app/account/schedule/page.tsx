'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'
import {
  eventsOnDate, mondayOfWeek, monthRange, normalizeActivity, normalizeEnrollment, toISO, weekRange,
  type Activity, type Enrollment, type RawActivity, type RawEnrollment,
} from '@/lib/schedule/calendar'
import AccountCard from '@/components/account/AccountCard'
import { ListSkeleton } from '@/components/PageSkeleton'
import ScheduleToolbar, { type Period, type ViewMode } from '@/components/schedule/ScheduleToolbar'
import { PendingStartDates, UpcomingEvents } from '@/components/schedule/ScheduleHighlights'
import MonthView from '@/components/schedule/MonthView'
import WeekView from '@/components/schedule/WeekView'
import ListView from '@/components/schedule/ListView'
import EventPopup from '@/components/schedule/EventPopup'
import type { SelectEvent } from '@/components/schedule/eventStyle'
import type { CalendarEvent } from '@/lib/schedule/calendar'

interface Selected {
  event: CalendarEvent
  position: { x: number; y: number }
}

function navigationLabel(period: Period, date: Date, from: string, to: string) {
  if (period === 'month') {
    const label = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    return label.replace(/^\w/, c => c.toUpperCase())
  }
  const short = (iso: string, withYear: boolean) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', ...(withYear ? { year: 'numeric' } : {}) })
  return `${short(from, false)} – ${short(to, true)}`
}

export default function SchedulePage() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selected, setSelected] = useState<Selected | null>(null)

  const authHeader = user ? { Authorization: `Bearer ${user.jwtToken}` } : undefined

  useEffect(() => {
    if (!user) return
    fetch(`${API_BASE}/user/schedule`, { headers: { Authorization: `Bearer ${user.jwtToken}` } })
      .then(response => response.json())
      .then(json => {
        const data = json.data ?? {}
        setEnrollments(((data.enrollments ?? []) as RawEnrollment[]).map(normalizeEnrollment))
        setActivities(((data.activities ?? []) as RawActivity[]).map(normalizeActivity))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const select: SelectEvent = (event, position) => setSelected({ event, position })

  const handleSetStartDate = async (enrollmentId: number, date: string) => {
    if (!authHeader) return
    const response = await fetch(`${API_BASE}/user/enrollments/${enrollmentId}/start-date`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ startDate: date }),
    })
    if (response.ok) {
      setEnrollments(prev => prev.map(e => (e.id === enrollmentId ? { ...e, status: 'active', startDate: date } : e)))
    }
  }

  const handleCancelActivity = async (id: number) => {
    const activity = activities.find(a => a.id === id)
    if (!activity || !authHeader) return
    await fetch(`${API_BASE}/item/${activity.itemId}/my-activities/${id}/cancel`, { method: 'PUT', headers: authHeader })
    setActivities(prev => prev.map(a => (a.id === id ? { ...a, status: -1 } : a)))
    setSelected(null)
  }

  const navigate = (direction: -1 | 1) => {
    setCurrentDate(date => {
      const next = new Date(date)
      if (period === 'week') next.setDate(date.getDate() + direction * 7)
      else next.setMonth(date.getMonth() + direction)
      return next
    })
  }

  const now = new Date()
  const today = toISO(now)
  const tomorrow = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
  const { from, to } = period === 'week' ? weekRange(currentDate) : monthRange(currentDate)
  const pending = enrollments.filter(e => e.status === 'pending')
  const hasAnything = enrollments.some(e => e.status === 'active') || pending.length > 0 || activities.length > 0

  return (
    <AccountCard title="Lịch học">
      {loading ? (
        <div className="p-5"><ListSkeleton showTitle={false} /></div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <ScheduleToolbar
            period={period}
            viewMode={viewMode}
            label={navigationLabel(period, currentDate, from, to)}
            onPeriodChange={setPeriod}
            onViewModeChange={setViewMode}
            onNavigate={navigate}
          />
          <PendingStartDates enrollments={pending} onSetStartDate={handleSetStartDate} />
          <UpcomingEvents today={eventsOnDate(enrollments, activities, today)} tomorrow={eventsOnDate(enrollments, activities, tomorrow)} onSelect={select} />

          {!hasAnything ? (
            <div className="py-10 text-center text-[13px] text-muted">Bạn chưa có lịch học nào.</div>
          ) : viewMode === 'list' ? (
            <ListView enrollments={enrollments} activities={activities} from={from} to={to} onSelect={select} />
          ) : period === 'month' ? (
            <MonthView
              key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
              enrollments={enrollments} activities={activities}
              year={currentDate.getFullYear()} month={currentDate.getMonth()} today={today} onSelect={select}
            />
          ) : (
            <WeekView enrollments={enrollments} activities={activities} weekStart={mondayOfWeek(currentDate)} today={today} onSelect={select} />
          )}
        </div>
      )}

      {selected && (
        <EventPopup event={selected.event} position={selected.position} onClose={() => setSelected(null)} onCancelActivity={handleCancelActivity} />
      )}
    </AccountCard>
  )
}
