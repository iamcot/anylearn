'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import BrandText from '@/components/fun/BrandText'
import ArenaMedal from '@/components/fun/arena/ArenaMedal'
import ArenaTitle from '@/components/fun/arena/ArenaTitle'
import { getArenaBoard, type ArenaResultBoard, type ArenaResultRow } from '@/lib/api/arena'
import { avatarColor, initial, ownApart, secondsText } from '@/lib/arena/board'

function dateText(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const names = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return `${names[new Date(y, m - 1, d).getDay()]} ${d}/${m}/${y}`
}

function shortDay(day: string): string {
  const [, m, d] = day.split('-').map(Number)
  return `${d}/${m}`
}

function Avatar({ name, size }: { name: string; size: number }) {
  return <span className="grid shrink-0 place-items-center rounded-full font-extrabold text-white" style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.4 }}>{initial(name)}</span>
}

const TOP_TINT = ['from-[#fff7d6]', 'from-[#f1f4f8]', 'from-[#fbeee4]']

function TopRow({ row, coin }: { row: ArenaResultRow; coin: string }) {
  const place = row.rank as 1 | 2 | 3
  return (
    <li className={`grid grid-cols-[44px_40px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-[#f0f4f8] bg-gradient-to-r ${TOP_TINT[place - 1]} to-white p-3 first:rounded-t-[inherit] ${row.me ? 'ring-2 ring-inset ring-green first:rounded-t-[inherit] last:rounded-b-[inherit]' : ''}`}>
      <span className="flex items-center gap-0.5 text-lg font-black text-ink"><ArenaMedal place={place} />{row.rank}</span>
      <Avatar name={row.name} size={40} />
      <span className="min-w-0">
        <span className="block truncate text-[17px] font-black text-ink">{row.name}{row.me ? ' (bạn)' : ''}</span>
        <span className="block truncate text-xs text-muted">{secondsText(row.correctMs)}{row.rewardCoins > 0 ? ` · +${row.rewardCoins} ` : ''}{row.rewardCoins > 0 && <BrandText text={coin} coinName={coin} />}</span>
      </span>
      <span className="text-right text-xl font-black tabular-nums text-ink">{row.score}<small className="block text-[10px] font-semibold text-muted">điểm</small></span>
    </li>
  )
}

function Row({ row, coin }: { row: ArenaResultRow; coin: string }) {
  return (
    <li className={`grid grid-cols-[30px_30px_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#f0f4f8] px-3 py-2 first:rounded-t-[inherit] last:rounded-b-[inherit] last:border-0 ${row.me ? 'bg-blue-soft' : ''}`}>
      <span className="text-center font-extrabold tabular-nums text-muted">{row.rank}</span>
      <Avatar name={row.name} size={30} />
      <span className="min-w-0 truncate font-bold text-ink">{row.name}{row.me ? ' (bạn)' : ''}
        <span className="text-[11px] font-medium text-muted"> · {secondsText(row.correctMs)}{row.me && row.rewardCoins > 0 ? ` · +${row.rewardCoins} ${coin}` : ''}</span></span>
      <span className="text-right font-black tabular-nums text-ink">{row.score}<small className="block text-[10px] font-semibold text-muted">điểm</small></span>
    </li>
  )
}

function Board() {
  const { token } = useAuth()
  const params = useSearchParams()
  const wanted = Number(params.get('session')) || undefined
  const [session, setSession] = useState<number | undefined>(wanted)
  const [board, setBoard] = useState<ArenaResultBoard | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    const { data, error: err } = await getArenaBoard(token, session)
    if (err || !data) return setError(err ?? 'Không tải được bảng xếp hạng')
    setError('')
    setBoard(data)
  }, [token, session])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const rows = board?.rows ?? []
  const coin = board?.rules?.coinName ?? 'Leo Xu'
  const info = board?.session
  const apart = ownApart(rows, board?.me ? { me: true, rank: board.me.rank, name: board.me.name, score: board.me.score, correctMs: board.me.correctMs, rewardCoins: board.me.rewardCoins } : null)
  const prizes = (board?.rules?.rewardCoins ?? []).filter(c => c > 0)

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      <div className="mb-3 text-center">
        <ArenaTitle text={info?.custom ? info.title : undefined} tone={info?.custom ? 'orange' : 'green'} className="text-2xl [font-family:var(--font-be-vietnam-pro),system-ui,sans-serif]" />
        {info && <p className="m-0 mt-1 text-[12.5px] text-muted">{info.custom ? 'Đấu trường riêng' : dateText(info.day)} · {info.questionCount} câu · {info.players} người chơi</p>}
        {info && (prizes.length > 0 || (board?.rules?.rewardParticipation ?? 0) > 0) && (
          <p className="m-0 mt-1 text-[12.5px] font-bold text-green-dark">
            {prizes.length > 0 && <>Top 3: <BrandText text={`${prizes.join(' / ')} ${coin}`} coinName={coin} />{board?.rules?.rewardSticker ? ' + 1 sticker' : ''}</>}
            {prizes.length > 0 && (board?.rules?.rewardParticipation ?? 0) > 0 && ' · '}
            {(board?.rules?.rewardParticipation ?? 0) > 0 && <>Tham gia: <BrandText text={`${board?.rules?.rewardParticipation} ${coin}`} coinName={coin} /></>}
          </p>
        )}
      </div>
      {error && <p className="text-center text-warn-text" role="alert">{error}</p>}
      {!board && !error && <div className="h-[260px] animate-pulse rounded-[22px] bg-slate-200" />}
      {board && !info?.custom && board.days.length > 0 && (
        <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Các ngày gần nhất">
          {board.days.map(d => {
            const on = d.id === info?.id
            return <button key={d.id} type="button" role="tab" aria-selected={on} onClick={() => setSession(d.id)}
              className={`min-h-9 flex-none cursor-pointer rounded-full border px-3 text-xs font-bold ${on ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink'}`}>{shortDay(d.day)}</button>
          })}
        </div>
      )}
      {board && !info && <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted ring-1 ring-line">Chưa có trận nào kết thúc.</p>}
      {info && (
        <>
          <ul className="m-0 list-none overflow-hidden rounded-2xl border border-line bg-white p-0">
            {rows.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Trận này chưa có người chơi.</li>}
            {rows.map(r => (r.rank <= 3 ? <TopRow key={r.rank} row={r} coin={coin} /> : <Row key={r.rank} row={r} coin={coin} />))}
          </ul>
          {apart && <ul className="sticky bottom-[calc(var(--app-tabs-h,0px)+0.5rem)] m-0 mt-2 list-none overflow-hidden rounded-[14px] border border-[#bcd9f5] bg-white p-0 shadow-[0_6px_16px_-10px_rgba(0,83,155,.5)]"><Row row={apart} coin={coin} /></ul>}
        </>
      )}
    </div>
  )
}

export default function ArenaBoardPage() {
  return <Suspense fallback={null}><Board /></Suspense>
}
