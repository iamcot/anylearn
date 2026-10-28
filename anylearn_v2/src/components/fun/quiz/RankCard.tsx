import type { QuizProfile } from '@/lib/api/quiz'
import { starPercent } from '@/lib/quiz/rules'
import RankBadge from './RankBadge'

/** Rank, star bar and guard of the player. */
export default function RankCard({ profile }: { profile: QuizProfile }) {
  const top = profile.needed <= 0
  return (
    <section className="rounded-3xl border border-line bg-white p-4 shadow-sm" aria-label="Hạng của bạn">
      <div className="flex items-center gap-4">
        <RankBadge rankKey={profile.rankKey} className="size-20" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-muted">Hạng hiện tại</div>
          <div className="text-2xl font-black leading-tight">{profile.rankName}</div>
          <div className="mt-1 text-sm font-bold text-ink">{top ? `${profile.stars} sao` : `${profile.stars} / ${profile.needed} sao`}</div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${profile.guard ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-muted'}`}>
          {profile.guard ? 'Có bảo hộ' : 'Hết bảo hộ'}
        </span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={profile.stars} aria-valuemax={top ? undefined : profile.needed}>
        <div className="h-full rounded-full bg-green transition-[width] duration-500" style={{ width: `${starPercent(profile.stars, profile.needed)}%` }} />
      </div>
    </section>
  )
}
