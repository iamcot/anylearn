'use client'

import Link from 'next/link'
import { Roboto_Condensed } from 'next/font/google'
import { useCallback, useEffect, useState } from 'react'
import { getArenaBanner, type ArenaCustomBanner as Custom } from '@/lib/api/arena'
import { clockText, dayLabel, timeText, type ArenaTiming } from '@/lib/arena/timeline'
import ArenaTitle from './ArenaTitle'
import CustomRulesSheet from './CustomRulesSheet'
import LeoArena from './LeoArena'
import { useArenaClock } from './useArenaClock'
import { useMyRankKey } from './useMyRankKey'

const tight = Roboto_Condensed({ subsets: ['vietnamese', 'latin'], weight: ['400', '600', '700', '800'] })

function timingOf(c: Custom): ArenaTiming | null {
  if (c.waiting || c.startsAt == null || c.openAt == null) return null
  return {
    startsAt: c.startsAt, openAt: c.openAt, questionCount: c.questionCount ?? 20, countdownSeconds: c.countdownSeconds ?? 10,
    answerSeconds: c.answerSeconds ?? 15, revealSeconds: c.revealSeconds ?? 5, gapSeconds: c.gapSeconds ?? 60,
  }
}

const SMALL = 'text-[10px] font-bold uppercase tracking-[.08em] text-[#ffe3c2]'
const BUTTON = 'whitespace-nowrap rounded-full bg-[#ffe066] px-2.5 py-1.5 text-[13px] font-extrabold text-[#4a1a00] no-underline'

/**
 * The orange banner of an arena the back office runs by hand ("đấu trường riêng"), above the automatic one. The title is the name the
 * back office typed, the time is the one it announced, there is no sign-up line. It disappears when the back office closes the arena.
 */
export default function ArenaCustomBanner({ token }: { token: string }) {
  const [custom, setCustom] = useState<Custom | null>(null)
  const [sheet, setSheet] = useState(false)
  const rankKey = useMyRankKey(token)
  const timing = custom ? timingOf(custom) : null
  const { now, phase, sync } = useArenaClock(timing, 1000)

  const load = useCallback(async () => {
    const { data } = await getArenaBanner(token)
    if (!data) return
    sync(data.serverNow)
    setCustom(data.custom ?? null)
  }, [token, sync])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // it can be started or closed at any moment, so ask often
  useEffect(() => {
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [load])

  if (!custom) return null
  const kind = phase?.kind
  const total = timing?.questionCount ?? custom.questionCount ?? 0
  const enter = `/fun/arena?custom=${custom.sessionId}`
  const inRoom = custom.inRoomCount ?? 0

  let stub: React.ReactNode
  let line3: string
  if (custom.waiting || !timing) {
    stub = (<><small className={SMALL}>Chờ bắt đầu</small><Link href={enter} className={BUTTON}>Vào phòng</Link></>)
    line3 = custom.expectedAt != null ? `Dự kiến ${timeText(custom.expectedAt)} ${dayLabel(custom.expectedAt, now)}` : 'Chờ ban tổ chức bắt đầu'
  } else if (kind === 'ended') {
    stub = (<><small className={SMALL}>Đã xong</small><Link href={`/fun/arena/board?session=${custom.sessionId}`} className={BUTTON}>Kết quả ›</Link></>)
    line3 = 'Đã kết thúc'
  } else if (kind === 'countdown' || kind === 'question' || kind === 'reveal' || kind === 'lobby') {
    stub = (<><small className={SMALL}>Đang đấu</small><span className="text-xl font-extrabold leading-[1.1] tabular-nums text-white">{phase?.qNo ?? 0}/{total}</span><Link href={enter} className={`${BUTTON}`}>Vào đấu</Link></>)
    line3 = 'Đang diễn ra'
  } else {
    stub = (<><small className={SMALL}>Bắt đầu sau</small><span className="text-lg font-extrabold leading-[1.1] tabular-nums text-white">{clockText(timing.startsAt - now)}</span><Link href={enter} className={BUTTON}>Vào phòng</Link></>)
    line3 = 'Sắp bắt đầu'
  }
  // a long name shrinks to stay on one line: about 0.6 em per letter in the space left beside Leo and the stub
  const titleSize = `clamp(11px, calc((100vw - 190px) / ${(Math.max(custom.title.length, 1) * 0.6).toFixed(1)}), 21px)`

  return (
    <>
      <section aria-label={custom.title} className={`${tight.className} relative mt-4 grid grid-cols-[minmax(0,1fr)_84px] overflow-hidden rounded-[20px] text-white shadow-[0_12px_26px_-14px_rgba(120,40,0,.8)]`}
        style={{ background: 'radial-gradient(120px 160px at 82% 10%, rgba(255,235,150,.35), transparent 70%), conic-gradient(from 200deg at 78% -10%, transparent 0 12deg, rgba(255,255,255,.1) 14deg 20deg, transparent 22deg 40deg, rgba(255,255,255,.08) 42deg 47deg, transparent 49deg), linear-gradient(160deg, #ff8a1f, #d9480f 75%)' }}>
        <div className="relative flex min-w-0 flex-col justify-center gap-1 py-[10px] pl-[60px] pr-2">
          <div className="max-w-full overflow-hidden"><ArenaTitle text={custom.title} tone="orange" className="[font-family:var(--font-be-vietnam-pro),system-ui,sans-serif]" style={{ fontSize: titleSize }} /></div>
          <div className="flex whitespace-nowrap text-[13px] leading-[1.5]">
            <button type="button" onClick={() => setSheet(true)} className="cursor-pointer border-0 border-b border-dotted border-white/70 bg-transparent p-0 font-semibold text-white [font:inherit] [font-weight:600]">Đấu trường riêng là gì?</button>
          </div>
          <div className="flex items-baseline gap-1 overflow-hidden whitespace-nowrap text-[13px] leading-[1.5] text-[#fff1df]">
            <span className="min-w-0 truncate"><b className="font-bold text-white">{line3}</b> · {inRoom} người</span>
          </div>
          <LeoArena rankKey={rankKey} className="pointer-events-none absolute -bottom-1 left-0 h-[72px] w-[60px]" />
        </div>
        <div className="relative flex flex-col items-center justify-center gap-0.5 border-l-2 border-dashed border-white/35 bg-gradient-to-b from-[#a8330a] to-[#6e1f04] px-[5px] py-2 text-center">
          <span aria-hidden className="absolute -left-[9px] -top-2 size-4 rounded-full bg-bg" />
          <span aria-hidden className="absolute -bottom-2 -left-[9px] size-4 rounded-full bg-bg" />
          {stub}
        </div>
      </section>
      {sheet && <CustomRulesSheet rules={custom.rules} onClose={() => setSheet(false)} />}
    </>
  )
}
