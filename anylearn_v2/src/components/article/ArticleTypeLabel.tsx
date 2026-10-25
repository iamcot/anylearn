import { BookIcon, CalendarIcon, GiftIcon, PlayIcon } from '@/components/icons'
import { ARTICLE_TYPE_LABELS } from '@/config/articleTypes'

const TYPE_ICONS: Record<string, typeof BookIcon> = {
  read: BookIcon,
  video: PlayIcon,
  event: CalendarIcon,
  promotion: GiftIcon,
}

export default function ArticleTypeLabel({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type]
  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon className="size-4 shrink-0" />}
      {ARTICLE_TYPE_LABELS[type] ?? type}
    </span>
  )
}
