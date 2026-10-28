'use client'

import { useEffect, useState } from 'react'
import type { QuizProfile } from '@/lib/api/quiz'
import { starPercent } from '@/lib/quiz/rules'
import { StarShape } from './StarBurst'
import RankBadge from './RankBadge'

/** Rank, star bar and guard of the player. */
export default function RankCard({ profile, fromRank, fromStars, delayMs = 900 }: {
  profile: QuizProfile
  /** Rank index before the answer: when it differs the medal slides from the old one to the new one. */
  fromRank?: number
  /** Stars before the answer: the number and the bar move from it to the new value once the star animation has played. */
  fromStars?: number
  /** How long the star animation of the result card takes; the card below waits for it. */
  delayMs?: number
}) {
  const rankChanged = fromRank !== undefined && fromRank !== profile.rank
  const old = rankChanged ? profile.ranks[fromRank] : undefined
  const startStars = fromStars !== undefined ? fromStars : profile.stars
  const [shown, setShown] = useState(startStars)
  const [swapped, setSwapped] = useState(!old)
  useEffect(() => {
    if (shown === profile.stars && swapped) return
    // a rank change shows the old rank until its medal has slid out (0.5 s) and the new one is on its way in
    const t = window.setTimeout(() => { setShown(profile.stars); setSwapped(true) }, delayMs + (old ? 1000 : 0))
    return () => window.clearTimeout(t)
  }, [shown, swapped, profile.stars, delayMs, old])
  const oldKey = old?.key
  const dir = fromRank !== undefined && fromRank > profile.rank ? 'down' : 'up'
  const showOld = !!old && !swapped
  const name = showOld ? old.name : profile.rankName
  const needed = showOld ? old.needed : profile.needed
  const top = needed <= 0
  return (
    <section className="rounded-3xl border border-line bg-white p-4 shadow-sm" aria-label="Hạng của bạn">
      <div className="flex items-center gap-4">
        {oldKey ? (
          <div className="relative size-20 shrink-0 overflow-hidden">
            <span className={`quiz-rank-out-${dir} absolute inset-0`} style={{ animationDelay: `${delayMs}ms` }}><RankBadge rankKey={oldKey} className="size-20" /></span>
            <span className={`quiz-rank-in-${dir} absolute inset-0`} style={{ animationDelay: `${delayMs}ms` }}><RankBadge rankKey={profile.rankKey} className="size-20" /></span>
          </div>
        ) : (
          <RankBadge rankKey={profile.rankKey} className="size-20" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-muted">Hạng hiện tại</div>
          <div className="text-2xl font-black leading-tight">{name}</div>
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
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={shown} aria-valuemax={needed}>
          <div className="h-full rounded-full bg-green transition-[width] duration-500" style={{ width: `${starPercent(showOld ? fromStars ?? 0 : shown, needed)}%` }} />
        </div>
      )}
    </section>
  )
}
