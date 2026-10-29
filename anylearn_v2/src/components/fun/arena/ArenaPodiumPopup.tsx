'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import BrandText from '@/components/fun/BrandText'
import { getArenaBoard, type ArenaResultBoard, type ArenaResultRow } from '@/lib/api/arena'
import { secondsText } from '@/lib/arena/board'
import ArenaMedal from './ArenaMedal'
import CelebrationFx from './CelebrationFx'

// the final ranks are written a few seconds after the last question, so the board is asked again until it is there
const TRIES = 15
const EVERY_MS = 2000

// each place is smaller than the one before
const SIZE = ['text-[21px]', 'text-[18px]', 'text-[15px]']
const SCORE = ['text-[21px]', 'text-[18px]', 'text-[15px]']
const MEDAL = ['h-[40px] w-8', 'h-[34px] w-[27px]', 'h-7 w-[22px]']

/**
 * The congratulation pop-up at the end of an arena, the same for the daily and the custom one: the top 3 of the final board, biggest
 * first, a medal beside each place, and fireworks over the rest of the screen for about 3 seconds.
 */
export default function ArenaPodiumPopup({ token, sessionId, title, onClose }: { token: string; sessionId: number; title?: string; onClose: () => void }) {
  const [board, setBoard] = useState<ArenaResultBoard | null>(null)

  useEffect(() => {
    let alive = true
    let tries = 0
    let timer: ReturnType<typeof setTimeout>
    const ask = async () => {
      const { data } = await getArenaBoard(token, sessionId)
      if (!alive) return
      const ready = data?.session?.id === sessionId && (data.rows?.length ?? 0) > 0
      if (ready && data) return setBoard(data)
      if (++tries < TRIES) timer = setTimeout(ask, EVERY_MS)
      else onClose()
    }
    ask()
    return () => { alive = false; clearTimeout(timer) }
  }, [token, sessionId, onClose])

  const top = (board?.rows ?? []).filter((r: ArenaResultRow) => r.rank <= 3 && r.score > 0)
  if (!board) return null
  if (top.length === 0) return <Closer onClose={onClose} />
  const coin = board.rules?.coinName ?? 'Leo Xu'
  const mine = board.me
  return (
    <>
      <div className="fixed inset-0 z-[120] bg-navy/70" onClick={onClose} />
      <CelebrationFx />
      <div className="pointer-events-none fixed inset-0 z-[122] grid place-items-center p-4">
        <div role="dialog" aria-modal="true" aria-label="Top 3 chung cuộc" className="pointer-events-auto w-full max-w-[420px] rounded-[24px] bg-gradient-to-b from-[#fffbea] to-white p-5 text-center shadow-[0_24px_60px_-18px_rgba(0,0,0,.6)]">
          <p className="m-0 text-xs font-extrabold uppercase tracking-[.12em] text-[#c98a00]">{title ?? 'Đấu trường Leo'}</p>
          <h3 className="m-0 mt-1 text-[22px] font-black leading-tight text-ink">Chúc mừng top 3 chung cuộc!</h3>
          <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
            {top.map(r => {
              const i = r.rank - 1
              return (
                <li key={r.rank} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${r.me ? 'bg-[#e6f6ec] ring-2 ring-green' : 'bg-white ring-1 ring-line'}`}>
                  <span className="flex items-center gap-1"><ArenaMedal place={r.rank as 1 | 2 | 3} className={`${MEDAL[i]} shrink-0`} /></span>
                  <span className="min-w-0">
                    <span className={`block truncate font-black text-ink ${SIZE[i]}`}>{r.name}</span>
                    <span className="block truncate text-xs text-muted">{secondsText(r.correctMs)}{r.rewardCoins > 0 && <> · +{r.rewardCoins} <BrandText text={coin} coinName={coin} /></>}</span>
                  </span>
                  <span className={`font-black tabular-nums text-ink ${SCORE[i]}`}>{r.score}<small className="block text-[10px] font-semibold text-muted">điểm</small></span>
                </li>
              )
            })}
          </ul>
          {mine && mine.rank > 3 && <p className="m-0 mt-3 text-sm text-muted">Bạn xếp hạng <b className="text-ink">{mine.rank}</b> với {mine.score} điểm. Cố lên lần sau nhé!</p>}
          <div className="mt-4 flex gap-2">
            <Link href={`/fun/arena/board?session=${sessionId}`} className="flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-green px-3 text-[15px] font-extrabold text-white no-underline">Xem bảng xếp hạng</Link>
            <button type="button" onClick={onClose} className="min-h-11 cursor-pointer rounded-2xl border border-line bg-white px-4 text-[15px] font-bold text-ink">Đóng</button>
          </div>
        </div>
      </div>
    </>
  )
}

/** Nobody scored: nothing to celebrate, close without a sound. */
function Closer({ onClose }: { onClose: () => void }) {
  useEffect(() => { onClose() }, [onClose])
  return null
}
