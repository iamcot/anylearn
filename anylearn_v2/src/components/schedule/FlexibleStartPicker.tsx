'use client'

import { useMemo, useState } from 'react'
import { dayMonth, earliestStart, longDay, resolveStart, suggestedStarts, todayIso, weekdayShort, type FlexibleClass } from '@/lib/schedule/flexibleStart'
import { CalendarIcon } from '@/components/icons'

interface Props {
  schedule: FlexibleClass
  /** The resolved start day (a class day), '' when none is picked. */
  value: string
  onChange: (day: string) => void
  /** 2 x 2 at every width (inside a narrow popup). */
  compact?: boolean
}

const TILE = 'flex min-h-[76px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-colors'
const tileTone = (active: boolean) => (active ? 'border-green bg-green-soft text-green-dark' : 'border-line bg-white text-ink hover:border-green')

/**
 * Start day of a flexible class: the next 3 class days, and a 4th tile with any day (the class then starts on the first
 * class day on or after it). 4 in a row on a desktop, 2 x 2 on a phone.
 */
export default function FlexibleStartPicker({ schedule, value, onChange, compact = false }: Props) {
  const today = todayIso()
  const suggestions = useMemo(() => suggestedStarts(schedule, today), [schedule, today])
  const [custom, setCustom] = useState('')
  const customStart = custom ? resolveStart(schedule, custom, today) : null
  const customActive = !!value && !suggestions.includes(value)

  const pickCustom = (day: string) => {
    setCustom(day)
    const start = day ? resolveStart(schedule, day, today) : null
    if (start) onChange(start)
  }

  if (suggestions.length === 0) return <p className="m-0 text-xs text-red">Ca học này không còn buổi nào để khai giảng.</p>

  return (
    <div>
      <div className="mb-2 text-[13px] font-bold text-ink">Chọn ngày khai giảng</div>
      <div className={`grid grid-cols-2 gap-2 ${compact ? '' : 'md:grid-cols-4'}`} role="radiogroup" aria-label="Ngày khai giảng">
        {suggestions.map(day => (
          <button key={day} type="button" role="radio" aria-checked={value === day} onClick={() => onChange(day)}
            className={`${TILE} ${tileTone(value === day)}`}>
            <span className="text-xs font-medium text-muted">{weekdayShort(day)}</span>
            <span className="text-lg font-extrabold leading-none">{dayMonth(day)}</span>
            {day === suggestions[0] && <span className="text-[11px] font-medium text-green">Sớm nhất</span>}
          </button>
        ))}
        <label className={`${TILE} relative ${tileTone(customActive)}`}>
          <span className="flex items-center gap-1 text-xs font-medium text-muted"><CalendarIcon className="size-3.5" />Ngày khác</span>
          <span className="text-lg font-extrabold leading-none">{customActive ? dayMonth(value) : 'Tự chọn'}</span>
          {customActive && custom && customStart !== custom && <span className="text-[11px] text-muted">từ {dayMonth(custom)}</span>}
          <input type="date" value={custom} min={earliestStart(today)} onChange={event => pickCustom(event.target.value)}
            aria-label="Chọn ngày khác"
            // a desktop browser opens the calendar only from its small icon: open it on any click of the tile
            onClick={event => { try { event.currentTarget.showPicker() } catch { /* older browsers open it by themselves */ } }}
            className="absolute inset-0 size-full cursor-pointer opacity-0" />
        </label>
      </div>
      {custom && !customStart && <p className="mb-0 mt-2 text-xs text-red">Ca học không còn buổi nào từ ngày này, vui lòng chọn ngày khác.</p>}
      <p className="mb-0 mt-2 text-xs text-muted">
        {value
          ? <>Khai giảng <strong className="text-green-dark">{longDay(value)}</strong>{customActive && custom && customStart !== custom ? ' (buổi học đầu tiên từ ngày bạn chọn)' : ''}.</>
          : 'Ngày khác: lớp khai giảng vào buổi học đầu tiên kể từ ngày bạn chọn.'}
      </p>
    </div>
  )
}
