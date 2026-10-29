'use client'

import Link from 'next/link'
import { Roboto_Condensed } from 'next/font/google'
import { useCallback, useEffect, useState } from 'react'
import { getArenaBanner, registerArena, unregisterArena, type ArenaBanner as Banner } from '@/lib/api/arena'
import { clockText, dayLabel, timeText, type ArenaTiming } from '@/lib/arena/timeline'
import ArenaRulesSheet from './ArenaRulesSheet'
import ArenaTitle from './ArenaTitle'
import LeoArena from './LeoArena'
import { useArenaClock } from './useArenaClock'

// narrow letters keep the three lines of the card short; used in this banner only
const tight = Roboto_Condensed({ subsets: ['vietnamese', 'latin'], weight: ['400', '600', '700', '800'] })

function timingOf(b: Banner): ArenaTiming | null {
  if (!b.sessionId || b.startsAt == null || b.openAt == null) return null
  return {
    startsAt: b.startsAt, openAt: b.openAt, questionCount: b.questionCount ?? 20, countdownSeconds: b.countdownSeconds ?? 10,
    answerSeconds: b.answerSeconds ?? 15, revealSeconds: b.revealSeconds ?? 5, gapSeconds: b.gapSeconds ?? 60,
  }
}

function minutesLeft(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return s >= 60 ? `Còn ${Math.ceil(s / 60)} phút` : `Còn ${s} giây`
}

/**
 * The entry point of Đấu trường Leo on /fun: a ticket with Leo on the left, the title and two short lines in the middle,
 * and the stub on the right (countdown to the room, then the "Vào đấu" button, then the result). Three lines high on purpose.
 */
export default function ArenaBanner({ token }: { token: string }) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [sheet, setSheet] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const timing = banner ? timingOf(banner) : null
  const { now, phase, sync } = useArenaClock(timing, 1000)

  const load = useCallback(async () => {
    const { data } = await getArenaBanner(token)
    if (!data) return
    sync(data.serverNow)
    setBanner(data)
  }, [token, sync])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // the numbers (people who promised) move slowly; the day changes on its own once the evening is over
  useEffect(() => {
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  const kind = phase?.kind
  useEffect(() => {
    // the session ended: ask again so the card moves on to the next day
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (kind === 'ended') load()
  }, [kind, load])

  if (!banner || !banner.enabled) return null
  const resultId = banner.endedSessionId ?? (kind === 'ended' ? banner.sessionId : null)
  if (!timing && !banner.endedSessionId) return null

  const showResult = kind === 'ended' || (banner.endedSessionId != null && kind === 'before')
  const live = kind === 'countdown' || kind === 'question' || kind === 'reveal' || kind === 'lobby'
  const total = timing?.questionCount ?? 0

  let stub: React.ReactNode
  if (showResult || !timing) {
    stub = (
      <>
        <small className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9fe8bf]">Đã xong</small>
        <Link href={`/fun/arena/board${resultId ? `?session=${resultId}` : ''}`} className="inline-flex items-center rounded-full bg-[#ffd84d] px-2.5 py-1.5 text-[13px] font-extrabold text-[#04261a] no-underline">Kết quả ›</Link>
      </>
    )
  } else if (kind === 'before') {
    stub = (
      <>
        <small className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9fe8bf]">Mở sau</small>
        <span className="text-lg font-extrabold leading-[1.1] tabular-nums text-white">{clockText(timing.openAt - now)}</span>
      </>
    )
  } else if (live && phase) {
    stub = (
      <>
        <small className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9fe8bf]">Đang đấu</small>
        <span className="text-xl font-extrabold leading-[1.1] tabular-nums text-white">{phase.qNo}/{total}</span>
        <Link href="/fun/arena" className="arena-go mt-1 inline-flex items-center rounded-full bg-[#39ff88] px-2.5 py-1.5 text-[13px] font-extrabold text-[#04261a] no-underline">Vào đấu ›</Link>
      </>
    )
  } else {
    stub = (
      <>
        <small className="text-[10px] font-bold uppercase tracking-[.08em] text-[#9fe8bf]">{phase ? minutesLeft(phase.msToNext) : ''}</small>
        <Link href="/fun/arena" className="arena-go inline-flex items-center rounded-full bg-[#39ff88] px-2.5 py-1.5 text-[13px] font-extrabold text-[#04261a] no-underline">Vào đấu ›</Link>
      </>
    )
  }

  async function remind() {
    if (!banner?.sessionId || busy) return
    setBusy(true)
    const { data } = await registerArena(token, banner.sessionId)
    setBusy(false)
    if (data) setBanner(b => (b ? { ...b, registered: true, registeredCount: data.registeredCount } : b))
  }

  async function unremind() {
    if (!banner?.sessionId || busy) return
    setBusy(true)
    const { data } = await unregisterArena(token, banner.sessionId)
    setBusy(false)
    setConfirm(false)
    if (data) setBanner(b => (b ? { ...b, registered: false, registeredCount: data.registeredCount } : b))
  }

  const canRemind = timing != null && (kind === 'before' || kind === 'open')
  let line2: React.ReactNode
  if (live) {
    line2 = <span className="min-w-0 truncate"><b className="font-bold text-white">Đang diễn ra</b> · {banner.inRoomCount ?? 0} người trong phòng</span>
  } else if (!timing) {
    line2 = <span className="min-w-0 truncate">Hẹn bạn ở trận sau</span>
  } else {
    line2 = (
      <>
        <span className="min-w-0 truncate"><b className="font-bold text-white">{timeText(timing.startsAt)} {dayLabel(timing.startsAt, now)}</b> · {banner.registeredCount ?? 0} người{canRemind ? ' ·' : ''}</span>
        {canRemind && (banner.registered
          ? (confirm
            ? <span className="flex-none text-[#9fe8bf]">Bỏ nhắc? <button type="button" onClick={unremind} className="cursor-pointer border-0 bg-transparent p-0 font-extrabold text-[#39ff88] underline [font:inherit]">Có</button> · <button type="button" onClick={() => setConfirm(false)} className="cursor-pointer border-0 bg-transparent p-0 font-bold text-white [font:inherit]">Không</button></span>
            : <button type="button" onClick={() => setConfirm(true)} className="flex-none cursor-pointer border-0 bg-transparent p-0 font-bold text-[#9fe8bf] [font:inherit]">Bạn đã hứa tham gia</button>)
          : <button type="button" onClick={remind} disabled={busy} className="flex-none cursor-pointer border-0 bg-transparent p-0 font-extrabold text-[#39ff88] underline underline-offset-[3px] [font:inherit]">Nhắc tôi</button>)}
      </>
    )
  }

  return (
    <section aria-label="Đấu trường Leo" className={`${tight.className} relative mt-4 grid grid-cols-[minmax(0,1fr)_78px] overflow-hidden rounded-[20px] text-[#e7eefb] shadow-[0_12px_26px_-14px_rgba(7,27,51,.8)]`}
      style={{ background: 'radial-gradient(120px 160px at 82% 10%, rgba(255,214,90,.28), transparent 70%), conic-gradient(from 200deg at 78% -10%, transparent 0 12deg, rgba(255,255,255,.07) 14deg 20deg, transparent 22deg 40deg, rgba(255,255,255,.06) 42deg 47deg, transparent 49deg), linear-gradient(160deg, #0d2a4d, #071b33 70%)' }}>
      <div className="relative flex min-w-0 flex-col justify-center gap-[3px] py-[9px] pl-[60px] pr-2">
        <ArenaTitle className="text-[clamp(17px,5.4vw,21px)] [font-family:var(--font-be-vietnam-pro),system-ui,sans-serif]" />
        <div className="flex gap-2.5 whitespace-nowrap text-[13px] leading-[1.3]">
          <button type="button" onClick={() => setSheet(true)} className="cursor-pointer border-0 border-b border-dotted border-[#cfe0ff]/60 bg-transparent p-0 font-semibold text-[#cfe0ff] [font:inherit] [font-weight:600]">Đấu trường là gì?</button>
          <Link href="/fun/arena/board" className="border-b border-dotted border-[#cfe0ff]/60 font-semibold text-[#cfe0ff] no-underline">Bảng xếp hạng ›</Link>
        </div>
        <div className="flex items-baseline gap-1 overflow-hidden whitespace-nowrap text-[13px] leading-[1.3]">{line2}</div>
        <LeoArena className="pointer-events-none absolute -bottom-1 left-0 h-[72px] w-[60px]" />
      </div>
      <div className="relative flex flex-col items-center justify-center gap-0.5 border-l-2 border-dashed border-white/25 bg-gradient-to-b from-[#0a3a24] to-[#04261a] px-[5px] py-2 text-center">
        <span aria-hidden className="absolute -left-[9px] -top-2 size-4 rounded-full bg-bg" />
        <span aria-hidden className="absolute -bottom-2 -left-[9px] size-4 rounded-full bg-bg" />
        {stub}
      </div>
      {sheet && <ArenaRulesSheet rules={banner.rules} onClose={() => setSheet(false)} />}
    </section>
  )
}
