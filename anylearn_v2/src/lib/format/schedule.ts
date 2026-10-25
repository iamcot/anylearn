import type { ItemSchedule } from '@/lib/api'
import { WEEKDAY_LABELS } from '@/config/itemLabels'

function timeRange(schedule: ItemSchedule): string {
  if (!schedule.timeStart) return ''
  return schedule.timeEnd ? `${schedule.timeStart}–${schedule.timeEnd}` : schedule.timeStart
}

export function formatSchedule(schedule: ItemSchedule): string {
  const time = timeRange(schedule)

  if (schedule.scheduleType === 'event' && schedule.eventDate) {
    const date = new Date(schedule.eventDate).toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    })
    return time ? `${date} · ${time}` : date
  }

  const days = schedule.weekdays
    ? schedule.weekdays.split(',').map(day => WEEKDAY_LABELS[day] ?? day).join(' ')
    : ''
  const from = schedule.dateStart ? `từ ${new Date(schedule.dateStart).toLocaleDateString('vi-VN')}` : ''
  return [days, time, from].filter(Boolean).join(' · ')
}
