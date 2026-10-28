'use client'

import BrandText from './BrandText'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getQuizMe } from '@/lib/api/quiz'
import RankBadge from '@/components/fun/quiz/RankBadge'
import { claimCheckin, type CheckinStatus } from '@/lib/api/fun'
import type { StickerView } from '@/lib/api/stickers'
import StickerArt from '@/components/fun/sticker/StickerArt'
import { afterClaim } from '@/lib/fun/checkin'
import { leoLines, type LeoContext } from '@/lib/fun/leo'
import { Leo, LeoBubble, useLeoWalk } from './Leo'
import SceneBackground from './SceneBackground'
import CoinIcon from './CoinIcon'

// Leo says one line after another; the key remounts this when the context changes so the first line shows at once.
function LeoSpeech({ lines }: { lines: string[] }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (lines.length < 2) return
    const id = setInterval(() => setTick(t => t + 1), 6000)
    return () => clearInterval(id)
  }, [lines.length])
  return <LeoBubble text={lines[tick % lines.length]} />
}

type Phase = { kind: 'idle' } | { kind: 'opening' } | { kind: 'claimed'; points: number; capped: boolean; streak: number; sticker?: StickerView | null; achievement?: string | null } | { kind: 'error'; message: string }

function contextOf(status: CheckinStatus, phase: Phase, coinName: string): LeoContext {
  if (phase.kind === 'opening') return { kind: 'opening' }
  if (phase.kind === 'claimed') return { kind: 'claimed', points: phase.points, capped: phase.capped, streak: phase.streak, sticker: phase.sticker?.name, coinName }
  if (phase.kind === 'error') return { kind: 'error', message: phase.message }
  if (!status.enabled) return { kind: 'closed' }
  if (status.claimedToday) return { kind: 'done', daysToWeekGift: 7 - status.dayInCycle }
  return { kind: 'waiting' }
}

// The Vui học landing: the scene (background component), Leo who talks in a bubble, the week of the streak and the daily gift.
export default function FunScene({ token, initial, reminder, childName, onClaimed }: { token: string; initial: CheckinStatus; reminder?: string | null; childName?: string | null; onClaimed?: () => void }) {
  const [status, setStatus] = useState(initial)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [reward, setReward] = useState(0)
  const busy = phase.kind === 'opening'
  const canOpen = status.enabled && !status.claimedToday
  const coinName = status.coinName
  const ctx = contextOf(status, phase, coinName)
  const walk = useLeoWalk()
  const [rankKey, setRankKey] = useState<string | null>(null)
  const [playedToday, setPlayedToday] = useState<boolean | undefined>(undefined)

  // once the gift is taken the box spot shows the player's rank, which leads to the quiz
  useEffect(() => {
    let cancelled = false
    getQuizMe(token).then(({ data }) => {
      if (cancelled || !data) return
      setPlayedToday(data.today.games > 0)
      if (!canOpen) setRankKey(data.profile.rankKey)
    })
    return () => { cancelled = true }
  }, [token, canOpen])

  const open = async () => {
    if (busy || !canOpen) return
    setPhase({ kind: 'opening' })
    // the box shakes at least 0.6 s so the person sees it open, even when the answer is quick
    const [{ data, error }] = await Promise.all([claimCheckin(token), new Promise(resolve => setTimeout(resolve, 600))])
    if (error || !data) { setPhase({ kind: 'error', message: error ?? 'Không mở được quà, thử lại sau nhé!' }); return }
    if (data.alreadyClaimed) setPhase({ kind: 'idle' })
    else setPhase({ kind: 'claimed', points: data.points, capped: !!data.capped, streak: data.streak ?? 0, sticker: data.sticker, achievement: data.achievement })
    if (data.points > 0) setReward(data.points)
    setStatus(prev => afterClaim(prev, data))
    onClaimed?.()
  }

  return (
    <section className="relative h-[230px] overflow-hidden rounded-[22px] border-[3px] border-green-soft" aria-label="Quà điểm danh">
      <SceneBackground />

      <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-3 pt-3 text-xs font-bold text-[#7c2d12]">
        <span className="rounded-full bg-white/75 px-3 py-1.5">🔥 {status.streak} ngày</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-1.5" title={coinName} aria-label={`${status.coins} ${coinName}`}><CoinIcon className="size-4" /> {status.coins}</span>
        <div className="flex flex-1 items-center gap-1.5 rounded-full bg-white/75 px-3 py-2" aria-label={`Ngày ${status.dayInCycle} trong tuần`}>
          {status.days.map(d => (
            <span key={d.day} title={`Ngày ${d.day}: ${d.points} ${coinName}`}
              className={`h-2 flex-1 rounded-full ${d.state === 'done' ? 'bg-[#fb923c]' : d.state === 'today' ? 'bg-[#f97316] ring-2 ring-[#fed7aa]' : 'bg-black/10'}`} />
          ))}
        </div>
        <span aria-hidden>🎁</span>
      </div>

      <div className="absolute bottom-[26px] left-4 w-14">
        <div className="relative" style={{ transform: `translateX(${walk.atEnd ? 150 : 0}%)`, transition: walk.walkMs ? `transform ${walk.walkMs}ms linear` : 'none' }}>
          <LeoSpeech key={ctx.kind} lines={leoLines(ctx, ctx.kind === 'done' || ctx.kind === 'claimed' ? reminder : null, { playedToday, childName, seed: new Date().getDate() })} />
          <Leo view={walk.view} moving={walk.moving} waving={walk.waving} />
        </div>
      </div>

      {canOpen || busy || !rankKey ? (
        <button type="button" onClick={open} disabled={!canOpen || busy}
          className="absolute bottom-[22px] right-6 flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 disabled:cursor-default">
          <span className={`inline-block text-5xl leading-none drop-shadow-[0_3px_3px_rgba(0,0,0,.25)] ${busy ? 'gift-shake' : canOpen ? 'gift-wobble' : 'opacity-60'}`} aria-hidden>🎁</span>
          <span className="mt-1 text-xs font-extrabold text-white [text-shadow:0_1px_3px_rgba(0,0,0,.45)]">{canOpen ? 'Mở quà' : 'Đã nhận'}</span>
        </button>
      ) : (
        <Link href="/today/fun/quiz" className="absolute bottom-[22px] right-5 flex flex-col items-center text-white no-underline">
          <span className="gift-wobble inline-block drop-shadow-[0_3px_3px_rgba(0,0,0,.25)]"><RankBadge rankKey={rankKey} className="size-14" /></span>
          <span className="mt-1 text-xs font-extrabold [text-shadow:0_1px_3px_rgba(0,0,0,.45)]">Bấm để leo rank</span>
        </Link>
      )}
      {phase.kind === 'claimed' && phase.sticker && (
        <Link href="/today/fun/sticker" className="absolute right-3 top-12 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold text-ink no-underline shadow">
          <span className="size-6"><StickerArt sticker={phase.sticker} className="size-full text-xl" /></span> Sticker mới: <BrandText text={phase.sticker.name} />
        </Link>
      )}
      {phase.kind === 'claimed' && phase.achievement && (
        <Link href={`/today/fun/share/${phase.achievement}`} className="absolute left-3 top-12 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold text-green-dark no-underline shadow">Khoe chuỗi {phase.streak} ngày</Link>
      )}
      {reward > 0 && (
        <div className="gift-fly pointer-events-none absolute bottom-[96px] right-4 text-xl font-black text-[#b45309] [text-shadow:0_1px_2px_#fff]" aria-hidden>+{reward} {coinName}</div>
      )}
    </section>
  )
}
