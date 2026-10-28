import type { QuizProfile } from '@/lib/api/quiz'
import { starPercent } from '@/lib/quiz/rules'
import { StarShape } from './StarBurst'
import RankBadge from './RankBadge'

/** Rank, star bar and guard of the player. */
export default function RankCard({ profile, fromRank }: { profile: QuizProfile; /** Rank index before the answer: when it differs the medal slides from the old one to the new one. */ fromRank?: number }) {
  const oldKey = fromRank !== undefined && fromRank !== profile.rank ? profile.ranks[fromRank]?.key : undefined
  const dir = fromRank !== undefined && fromRank > profile.rank ? 'down' : 'up'
  const top = profile.needed <= 0
  return (
    <section className="rounded-3xl border border-line bg-white p-4 shadow-sm" aria-label="Hạng của bạn">
      <div className="flex items-center gap-4">
        {oldKey ? (
          <div className="relative size-20 shrink-0 overflow-hidden">
            <span className={`quiz-rank-out-${dir} absolute inset-0`}><RankBadge rankKey={oldKey} className="size-20" /></span>
            <span className={`quiz-rank-in-${dir} absolute inset-0`}><RankBadge rankKey={profile.rankKey} className="size-20" /></span>
          </div>
        ) : (
          <RankBadge rankKey={profile.rankKey} className="size-20" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-muted">Hạng hiện tại</div>
          <div className="text-2xl font-black leading-tight">{profile.rankName}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-sm font-black text-ink">
            {top ? `${profile.stars} x` : `${profile.stars} / ${profile.needed}`}
            <StarShape className="size-5" filled />
            <span className="sr-only">sao</span>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${profile.guard ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-muted'}`}>
          {profile.guard ? 'Có bảo hộ' : 'Hết bảo hộ'}
        </span>
      </div>
      {!top && (
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={profile.stars} aria-valuemax={profile.needed}>
          <div className="h-full rounded-full bg-green transition-[width] duration-500" style={{ width: `${starPercent(profile.stars, profile.needed)}%` }} />
        </div>
      )}
    </section>
  )
}
