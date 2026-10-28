'use client'

import { useEffect, useState } from 'react'
import type { QuizProfile } from '@/lib/api/quiz'
import { starPercent } from '@/lib/quiz/rules'
import { StarShape } from './StarBurst'
import RankBadge from './RankBadge'

/** Rank, star bar and guard of the player. */
export default function RankCard({ profile, fromRank, fromStars }: {
  profile: QuizProfile
  /** Rank index before the answer: when it differs the medal slides from the old one to the new one. */
  fromRank?: number
  /** Stars before the answer: the number and the bar move from it to the new value once the star animation has played. */
  fromStars?: number
}) {
  const sameRank = fromRank === undefined || fromRank === profile.rank
  const startStars = sameRank && fromStars !== undefined ? fromStars : profile.stars
  const [shown, setShown] = useState(startStars)
  useEffect(() => {
    if (shown === profile.stars) return
    const t = window.setTimeout(() => setShown(profile.stars), 900)
    return () => window.clearTimeout(t)
  }, [shown, profile.stars])
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
            {top ? `${shown} x` : shown}
            <StarShape className="size-5" filled />
            <span className="sr-only">sao</span>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${profile.guard ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-muted'}`}>
          {profile.guard ? 'Có bảo hộ' : 'Hết bảo hộ'}
        </span>
      </div>
      {!top && (
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={shown} aria-valuemax={profile.needed}>
          <div className="h-full rounded-full bg-green transition-[width] duration-500" style={{ width: `${starPercent(shown, profile.needed)}%` }} />
        </div>
      )}
    </section>
  )
}
