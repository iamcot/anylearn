'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronLeftIcon } from '@/components/icons'
import { registerArena, unregisterArena, type ArenaBoardRow, type ArenaLobby as Lobby, type ArenaMe } from '@/lib/api/arena'
import { avatarColor, initial, ownApart, secondsText } from '@/lib/arena/board'
import { dayLabel, nextLine, timeText, type ArenaPhase } from '@/lib/arena/timeline'
import ArenaRulesSheet from './ArenaRulesSheet'
import ArenaTitle from './ArenaTitle'
import LeoArena from './LeoArena'
import { useMyRankKey } from './useMyRankKey'

function Avatar({ name, size = 30 }: { name: string; size?: number }) {
  return <span className="grid shrink-0 place-items-center rounded-full font-extrabold text-white" style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.4 }}>{initial(name)}</span>
}

function PreRow({ row }: { row: ArenaBoardRow }) {
  return (
    <li className={`grid grid-cols-[30px_30px_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#f0f4f8] px-3 py-2 last:border-0 ${row.me ? 'bg-blue-soft' : ''}`}>
      <span className="text-center font-extrabold tabular-nums text-muted">{row.rank}</span>
      <Avatar name={row.name} />
      <span className="truncate font-bold text-ink">{row.name}{row.me ? ' (bạn)' : ''}</span>
      {row.inRoom
        ? <span className="arena-in text-[11px] font-extrabold">Trong phòng</span>
        : <span className="rounded-full bg-green-soft px-2.5 py-0.5 text-[11px] font-extrabold text-[#3f9e6c]">Đăng ký</span>}
    </li>
  )
}

function LiveRow({ row, me }: { row: { rank: number | null; name: string; score?: number; correctMs?: number; lastCorrect?: boolean }; me: boolean }) {
  return (
    <li className={`grid grid-cols-[30px_30px_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#f0f4f8] px-3 py-2 last:border-0 ${me ? 'bg-blue-soft' : ''}`}>
      <span className="text-center font-extrabold tabular-nums text-muted">{row.rank ?? '–'}</span>
      <Avatar name={row.name} />
      <span className="min-w-0 truncate font-bold text-ink">{row.name}{me ? ' (bạn)' : ''}
        {secondsText(row.correctMs ?? 0) && <span className="text-[11px] font-medium text-muted"> · {secondsText(row.correctMs ?? 0)}</span>}</span>
      <span className="text-right font-black tabular-nums text-ink">{row.score ?? 0}{row.lastCorrect && <span className="ml-1 text-[11px] font-extrabold text-green">+1</span>}<small className="block text-[10px] font-semibold text-muted">điểm</small></span>
    </li>
  )
}

/** Remind / "already promised" control for the coming session; asks before taking the promise back. */
export function RemindLine({ token, sessionId, registered, onChange }: { token: string; sessionId: number; registered: boolean; onChange: (registered: boolean) => void }) {
  const [busy, setBusy] = useState(false)
  const [ask, setAsk] = useState(false)
  async function toggle(next: boolean) {
    setBusy(true)
    const { data } = next ? await registerArena(token, sessionId) : await unregisterArena(token, sessionId)
    setBusy(false)
    setAsk(false)
    if (data) onChange(next)
  }
  if (!registered) return <button type="button" disabled={busy} onClick={() => toggle(true)} className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-extrabold text-[#39ff88] underline underline-offset-[3px]">Nhắc tôi</button>
  if (ask) {
    return (
      <span className="text-[13px] text-[#9fe8bf]">Bỏ nhắc?{' '}
        <button type="button" disabled={busy} onClick={() => toggle(false)} className="cursor-pointer border-0 bg-transparent p-0 font-extrabold text-[#39ff88] underline">Có</button>{' · '}
        <button type="button" onClick={() => setAsk(false)} className="cursor-pointer border-0 bg-transparent p-0 font-bold text-white">Không</button>
      </span>
    )
  }
  return <button type="button" onClick={() => setAsk(true)} className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-bold text-[#9fe8bf]">Bạn đã hứa tham gia</button>
}

/** The lobby: title, the line that counts down to the next question, the board and the person's own line pinned below it. */
export default function ArenaLobby({ token, lobby, phase, now, onRegistered }: { token: string; lobby: Lobby; phase: ArenaPhase; now: number; onRegistered: (registered: boolean) => void }) {
  const rankKey = useMyRankKey(token)
  const [sheet, setSheet] = useState(false)
  const rows = lobby.board ?? []
  const startsAt = lobby.startsAt ?? 0
  const total = lobby.questionCount ?? 0
  const dayPast = lobby.endedSessionId != null && phase.kind === 'before'
  const ended = phase.kind === 'ended' || dayPast
  const pre = !lobby.started
  const mine: ArenaMe | null | undefined = lobby.me
  const meRow = mine ? { me: true, rank: mine.rank, name: mine.name, score: mine.score, correctMs: mine.correctMs, lastCorrect: mine.lastCorrect } : null
  const pinned = pre ? null : ownApart(rows.map(r => ({ me: r.me })), meRow ? { me: true } : null) ? meRow : null
  const dateLabel = startsAt ? `${dayLabel(startsAt, now)} · ${timeText(startsAt)}` : ''
  const opensAt = lobby.openAt ?? 0

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      <div className="relative overflow-hidden rounded-[20px] p-3.5 text-[#dfe9f8]" style={{ background: 'linear-gradient(160deg, #0d2a4d, #071b33)' }}>
        <ArenaTitle className="text-[28px] [font-family:var(--font-be-vietnam-pro),system-ui,sans-serif]" />
        <div className="mt-1.5">
          <button type="button" onClick={() => setSheet(true)} className="cursor-pointer border-0 border-b border-dotted border-[#cfe0ff]/60 bg-transparent p-0 text-[13px] font-semibold text-[#cfe0ff]">Đấu trường Leo là gì?</button>
        </div>
        {!ended && (
          <div className="mt-1.5 max-w-[calc(100%-80px)] text-xs text-[#b9c8dd]">
            {pre ? `${dateLabel} · ${total} câu · ${lobby.counts?.registered ?? 0} người đăng ký` : `Đã xong câu ${lobby.lastFinished ?? 0}/${total} · ${lobby.counts?.inRoom ?? 0} người trong phòng`}
          </div>
        )}
        {!ended && pre && lobby.sessionId != null && phase.kind !== 'countdown' && (
          <div className="mt-1"><RemindLine token={token} sessionId={lobby.sessionId} registered={lobby.registered ?? false} onChange={onRegistered} /></div>
        )}
        <LeoArena rankKey={rankKey} className="pointer-events-none absolute right-1 top-1 h-20 w-[70px]" />
      </div>

      {ended ? (
        <div className="mt-3 rounded-2xl bg-white p-4 text-center ring-1 ring-line">
          <p className="m-0 text-base font-black text-ink">Trận hôm nay đã kết thúc</p>
          <p className="m-0 mt-1 text-sm text-muted">Cảm ơn bạn đã tham gia! Xem ai đứng đầu bảng nhé.</p>
          <Link href={`/fun/arena/board${lobby.endedSessionId ? `?session=${lobby.endedSessionId}` : ''}`} className="mt-3 inline-flex min-h-11 items-center rounded-2xl bg-green px-5 text-base font-extrabold text-white no-underline">Xem bảng xếp hạng</Link>
          {dayPast && startsAt > 0 && lobby.sessionId != null && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-navy px-3 py-2 text-[13px] text-[#cfe0ff]">
              <span>Trận tiếp theo: <b className="text-white">{timeText(startsAt)} {dayLabel(startsAt, now)}</b></span>
              <RemindLine token={token} sessionId={lobby.sessionId} registered={lobby.registered ?? false} onChange={onRegistered} />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="sticky top-0 z-[5] mt-2.5 flex items-center gap-2 rounded-xl border border-[#ffe27a] bg-[#fff8d6] px-3 py-2.5 font-bold tabular-nums text-[#6b4a00]">
            <span className="arena-blink size-2 shrink-0 rounded-full bg-red" aria-hidden />
            <span>{phase.kind === 'before' ? `Phòng mở lúc ${timeText(opensAt)}` : nextLine(phase) || 'Câu cuối đang diễn ra'}</span>
          </div>
          <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex justify-between gap-2.5 whitespace-nowrap border-b border-line px-3 py-2.5 text-xs font-bold text-muted">
              <span>{pre ? 'Người tham gia hôm nay' : `Xếp hạng sau câu ${lobby.lastFinished ?? 0}`}</span>
              <span>{pre ? `${lobby.counts?.inRoom ?? 0} trong phòng · ${lobby.counts?.registered ?? 0} đăng ký` : 'Điểm'}</span>
            </div>
            {rows.length === 0
              ? <p className="m-0 px-3 py-6 text-center text-sm text-muted">{pre ? 'Chưa có ai trong danh sách. Hãy là người đầu tiên!' : 'Chưa có ai ghi điểm.'}</p>
              : <ul className="m-0 list-none p-0">{rows.map((r, i) => (pre ? <PreRow key={i} row={r} /> : <LiveRow key={i} row={r} me={r.me} />))}</ul>}
          </div>
          {pinned && <ul className="sticky bottom-[calc(var(--app-tabs-h,0px)+0.5rem)] m-0 mt-2 list-none overflow-hidden rounded-[14px] border border-[#bcd9f5] bg-white p-0 shadow-[0_6px_16px_-10px_rgba(0,83,155,.5)]"><LiveRow row={pinned} me /></ul>}
        </>
      )}
      {sheet && <ArenaRulesSheet rules={lobby.rules} onClose={() => setSheet(false)} />}
    </div>
  )
}
