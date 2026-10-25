import { ACTIVITY_LABELS } from '@/config/itemLabels'
import { CheckIcon } from '@/components/icons'

export default function ItemActivityChips({ activities }: { activities?: { type: string; date?: string }[] }) {
  if (!activities || activities.length === 0) return null
  return (
    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-green-dark">
      {activities.map((activity, index) => (
        <span key={index} className="flex items-center gap-1">
          <CheckIcon className="size-3.5 text-green" />
          {ACTIVITY_LABELS[activity.type] ?? activity.type}
          {activity.date ? ` · ${activity.date}` : ''}
        </span>
      ))}
    </div>
  )
}
