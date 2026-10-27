import type { CalendarEvent } from '@/lib/schedule/calendar'
import MissedBadge from './MissedBadge'
import { eventColorClass, eventLabel, pointOf, type SelectEvent } from './eventStyle'

interface Props {
  event: CalendarEvent
  onSelect: SelectEvent
  wrap?: boolean
}

export default function EventChip({ event, onSelect, wrap = false }: Props) {
  return (
    <button
      type="button"
      onClick={mouse => onSelect(event, pointOf(mouse))}
      className={`block w-full cursor-pointer rounded border-0 px-1.5 py-0.5 text-left text-[11px] font-medium leading-[1.4] text-white ${eventColorClass(event)} ${
        wrap ? 'whitespace-normal' : 'truncate'
      }`}
    >
      <MissedBadge event={event} compact />{eventLabel(event)}
    </button>
  )
}
