import { CoinIcon } from '@/components/icons'
import { rewardLabel } from '@/lib/points/reward'

export default function PointsRewardBadge({ points, vndValue, className = '' }: {
  points: number
  vndValue?: number
  className?: string
}) {
  if (points <= 0) return null
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-green-line bg-green-soft px-3 py-1.5 text-sm font-medium text-green-dark ${className}`}>
      <CoinIcon className="size-4 text-green" />
      {rewardLabel(points, vndValue)}
    </span>
  )
}
