import { ACTIVITY_LABELS } from '@/config/itemLabels'
import type { CalendarEvent } from '@/lib/schedule/calendar'

// Full class names so Tailwind can see them.
const COURSE_COLORS = ['bg-event-1', 'bg-event-2', 'bg-event-3', 'bg-event-4', 'bg-event-5', 'bg-event-6', 'bg-event-7']
const ACTIVITY_COLOR = 'bg-activity'

export function eventColorClass(event: CalendarEvent): string {
  return event.kind === 'activity' ? ACTIVITY_COLOR : COURSE_COLORS[event.data.id % COURSE_COLORS.length] ?? ACTIVITY_COLOR
}

export function eventLabel(event: CalendarEvent): string {
  if (event.kind === 'activity') return `${ACTIVITY_LABELS[event.data.type] ?? event.data.type} · ${event.data.itemTitle}`
  return `${event.data.timeStart ? `${event.data.timeStart} ` : ''}${event.data.itemTitle}`
}

export function eventKey(event: CalendarEvent): string {
  return `${event.kind}-${event.data.id}`
}

export type SelectEvent = (event: CalendarEvent, position: { x: number; y: number }) => void

export function pointOf(mouseEvent: React.MouseEvent): { x: number; y: number } {
  return { x: mouseEvent.clientX, y: mouseEvent.clientY }
}
