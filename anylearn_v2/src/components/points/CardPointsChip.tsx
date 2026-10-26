import { CoinIcon } from '@/components/icons'
import { CARD_POINTS_ENABLED } from '@/lib/features'
import { cardPointsLabel } from '@/lib/points/reward'

/** Small "+X anyPoint" chip for a course card in a list; renders nothing when the flag is off or there are no points. */
export default function CardPointsChip({ points, className = '' }: { points?: number; className?: string }) {
  const label = CARD_POINTS_ENABLED ? cardPointsLabel(points) : null
  if (!label) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-green-line bg-green-soft px-2 py-0.5 text-[11px] font-extrabold text-green-dark md:text-xs ${className}`}>
      <CoinIcon className="size-3 text-green" />
      {label}
    </span>
  )
}
