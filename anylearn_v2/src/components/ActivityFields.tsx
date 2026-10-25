import { ACTIVITY_LABELS } from '@/config/itemLabels'
import type { ActivityChoice, ActivityType } from '@/lib/activities'

interface Props {
  type: ActivityType
  label?: string
  choice: ActivityChoice
  onChange: (choice: ActivityChoice) => void
}

export default function ActivityFields({ type, label = ACTIVITY_LABELS[type], choice, onChange }: Props) {
  return (
    <div className={`rounded-xl border p-3 transition-colors ${choice.checked ? 'border-green bg-green-soft' : 'border-line'}`}>
      <label className="flex min-h-11 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={choice.checked}
          onChange={event => onChange({ ...choice, checked: event.target.checked })}
          className="size-4 accent-green"
        />
        <span className={`text-sm font-bold ${choice.checked ? 'text-green-dark' : 'text-ink'}`}>{label}</span>
      </label>
      {choice.checked && (
        <div className="flex flex-col gap-2 pb-1 pl-6 sm:flex-row">
          <input type="date" value={choice.date} onChange={event => onChange({ ...choice, date: event.target.value })}
            className="field text-sm sm:max-w-[190px]" aria-label={`Ngày mong muốn: ${label}`} />
          <input type="text" value={choice.note} onChange={event => onChange({ ...choice, note: event.target.value })}
            className="field text-sm" placeholder="Ghi chú (tuỳ chọn)" aria-label={`Ghi chú: ${label}`} />
        </div>
      )}
    </div>
  )
}
