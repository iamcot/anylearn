import Link from 'next/link'
import type { Achievement } from '@/lib/api/achievements'
import { bannerStyle } from '@/lib/achievements/share'
import { RANK_COLORS } from '@/lib/quiz/rules'
import AchievementIcon from './AchievementIcon'

/** One achievement: a small picture of the banner, title and line, with a band of light running round the card. */
export default function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const [light] = RANK_COLORS[bannerStyle(a.icon).key] ?? RANK_COLORS.dong
  return (
    <Link href={`/fun/share/${a.token}`} className="glow-ring glow-gold relative flex items-center gap-3 rounded-2xl border border-line bg-white p-2 pr-3 text-ink no-underline">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl" style={{ background: `radial-gradient(circle at 30% 25%, #fff 0, ${light}55 70%)` }}>
        <AchievementIcon icon={a.icon} size={34} />
      </span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{a.title}</span><span className="block truncate text-xs text-muted">{a.subtitle}</span></span>
      <span className="shrink-0 text-sm font-bold text-green-dark">Chia sẻ ›</span>
    </Link>
  )
}
