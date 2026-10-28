'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import FixedBar from '@/components/fun/FixedBar'
import RankBadge from '@/components/fun/quiz/RankBadge'
import { getQuizBoard, getQuizMe, setBoardHidden, type Board, type BoardEntry, type BoardType, type QuizMe } from '@/lib/api/quiz'
import { BOARD_TABS, boardHint, ownLineApart, periodLabel, scoreText } from '@/lib/quiz/board'

const PLACE_STYLE = ['bg-amber-300 text-amber-900', 'bg-slate-300 text-slate-800', 'bg-orange-300 text-orange-900']

function Line({ entry, type }: { entry: BoardEntry; type: BoardType }) {
  return (
    <li className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${entry.me ? 'bg-green-soft ring-2 ring-green' : 'bg-white ring-1 ring-line'}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-black ${PLACE_STYLE[entry.place - 1] ?? 'bg-slate-100 text-muted'}`}>{entry.place}</span>
      <RankBadge rankKey={entry.rankKey} className="size-9" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{entry.name}{entry.me ? ' (bạn)' : ''}</div>
        <div className="text-xs text-muted">{type === 'week' || type === 'month' ? `${entry.rankName} · ${entry.stars} sao` : ''}</div>
      </div>
      <b className="shrink-0 text-sm">{scoreText(entry, type)}</b>
    </li>
  )
}

export default function QuizBoardPage() {
  const { token } = useAuth()
  const [me, setMe] = useState<QuizMe | null>(null)
  const [type, setType] = useState<BoardType>('week')
  const [rank, setRank] = useState<number | null>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    getQuizMe(token).then(({ data }) => {
      if (!data) return
      setMe(data)
      setRank(r => r ?? data.profile.rank)
    })
  }, [token])

  const load = useCallback(async () => {
    if (!token) return
    const { data, error: err } = await getQuizBoard(token, type, type === 'rank' ? rank ?? undefined : undefined)
    if (err || !data) return setError(err ?? 'Không tải được bảng xếp hạng')
    setError('')
    setBoard(data)
  }, [token, type, rank])

  useEffect(() => {
    if (type === 'rank' && rank === null) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load, type, rank])

  async function toggleHidden() {
    if (!token || !board) return
    setBusy(true)
    const { data } = await setBoardHidden(token, !board.hidden)
    setBusy(false)
    if (data) load()
  }

  const apart = board ? ownLineApart(board.entries, board.me) : null
  const ranks = me?.profile.ranks ?? []

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/today/fun/quiz" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted no-underline"><ChevronLeftIcon className="size-4" /> Leo rank</Link>
      <h1 className="m-0 text-2xl font-black">Bảng xếp hạng</h1>

      <div className="mt-3 grid grid-cols-4 gap-1.5" role="tablist">
        {BOARD_TABS.map(t => (
          <button key={t.type} type="button" role="tab" aria-selected={type === t.type} onClick={() => setType(t.type)}
            className={`min-h-10 min-w-0 cursor-pointer truncate rounded-full border px-1 text-xs font-bold sm:text-sm ${type === t.type ? 'border-green bg-green text-white' : 'border-line bg-white text-ink'}`}>{t.label}</button>
        ))}
      </div>

      {type === 'rank' && ranks.length > 0 && (
        <div className="mt-2">
          <div className="grid grid-cols-8 gap-1">
            {ranks.map((r, i) => (
              <button key={r.key} type="button" onClick={() => setRank(i)} aria-label={r.name} aria-pressed={rank === i} title={r.name}
                className={`grid cursor-pointer place-items-center rounded-xl border py-1.5 ${rank === i ? 'border-green bg-green-soft ring-2 ring-green' : 'border-line bg-white opacity-70'}`}>
                <RankBadge rankKey={r.key} className="size-7" />
              </button>
            ))}
          </div>
          {rank !== null && ranks[rank] && <div className="mt-1 text-center text-xs font-bold text-green-dark">Hạng {ranks[rank].name}</div>}
        </div>
      )}

      <p className="mb-0 mt-3 text-sm text-muted">{periodLabel(board?.period ?? null) && <b className="text-ink">{periodLabel(board?.period ?? null)}. </b>}{boardHint(type)}</p>

      {error && <p className="mt-3 text-warn-text" role="alert">{error}</p>}
      {!error && !board && <div className="mt-3 h-64 animate-pulse rounded-2xl bg-slate-200" />}
      {board && board.entries.length === 0 && <p className="mt-4 rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Chưa có ai trên bảng này. Chơi một câu để lên bảng nhé!</p>}
      {board && board.entries.length > 0 && (
        <ol className="m-0 mt-3 grid list-none gap-2 p-0">
          {board.entries.map(e => <Line key={e.place} entry={e} type={type} />)}
        </ol>
      )}
      {apart && (
        <FixedBar><ol className="m-0 list-none p-0 shadow-[0_6px_16px_rgba(15,23,42,.18)]"><Line entry={apart} type={type} /></ol></FixedBar>
      )}

      {board && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-4 text-sm">
          <p className="m-0">{board.hidden ? 'Bạn đang ẩn khỏi các bảng xếp hạng, tên bạn không hiện cho người khác.' : 'Tên hiển thị trên bảng là hai từ cuối của tên bạn, không có số điện thoại hay email.'}</p>
          <button type="button" disabled={busy} onClick={toggleHidden} className="mt-2 min-h-10 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-bold text-ink disabled:opacity-60">
            {board.hidden ? 'Hiện lại trên bảng' : 'Ẩn tôi khỏi bảng'}
          </button>
        </div>
      )}
    </div>
  )
}
