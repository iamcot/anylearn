'use client'

import { createContext, useContext } from 'react'
import type { CalendarEvent } from '@/lib/schedule/calendar'

/** Tells the calendar views which sessions are over and still not marked as attended (the page knows the attendance). */
export const MissedContext = createContext<(event: CalendarEvent) => boolean>(() => false)

export function useIsMissed(event: CalendarEvent): boolean {
  return useContext(MissedContext)(event)
}

/** "Chưa điểm danh" label; `compact` is the small "!" used inside the coloured chips of the month and week views. */
export default function MissedBadge({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  if (!useIsMissed(event)) return null
  if (compact) {
    return <span title="Chưa điểm danh" className="mr-1 inline-block rounded-sm bg-white px-1 text-[10px] font-extrabold leading-[1.3] text-warn-text">!</span>
  }
  return <span className="shrink-0 rounded-full border border-warn-line bg-warn-soft px-2 py-0.5 text-[10px] font-bold text-warn-text">Chưa điểm danh</span>
}
