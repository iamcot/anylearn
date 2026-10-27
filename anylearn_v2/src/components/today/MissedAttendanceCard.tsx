'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getMissedAttendance, markAttended } from '@/lib/today/api'
import type { MissedAttendance, MissedSession } from '@/lib/today/types'

const formatDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })

function Row({ session, token, onDone }: { session: MissedSession; token: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function mark() {
    setBusy(true)
    setError('')
    const { error: err } = await markAttended(session.learnerId, session.sessionKey, token)
    setBusy(false)
    if (err) return setError(err)
    onDone()
  }

  return (
    <li className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-ink">{session.itemTitle}</div>
        <div className="text-xs text-muted">{formatDay(session.date)}{session.start ? ` · ${session.start.substring(0, 5)}` : ''}</div>
        {error && <div className="text-xs text-red">{error}</div>}
      </div>
      <button type="button" onClick={mark} disabled={busy}
        className="min-h-11 shrink-0 cursor-pointer rounded-full border-0 bg-green px-4 text-sm font-bold text-white disabled:opacity-60">
        {busy ? '...' : 'Điểm danh bù'}
      </button>
    </li>
  )
}

/** "Buổi chưa điểm danh" (the 3 newest past sessions nobody marked) with a button to mark them now and a link to the full calendar. */
export default function MissedAttendanceCard({ learnerId, token }: { learnerId: number; token: string }) {
  const [data, setData] = useState<MissedAttendance | null>(null)

  useEffect(() => {
    let cancelled = false
    getMissedAttendance(learnerId, token).then(({ data: result }) => { if (!cancelled && result) setData(result) })
    return () => { cancelled = true }
  }, [learnerId, token])

  if (!data || data.total === 0) return null
  const remaining = data.total - data.items.length
  return (
    <section className="rounded-[20px] border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Buổi chưa điểm danh</span>
        <span className="rounded-full bg-warn-soft border border-warn-line px-2 py-0.5 text-xs font-bold text-warn-text">{data.total}</span>
      </div>
      <ul className="m-0 mt-2 list-none p-0">
        {data.items.map(session => (
          <Row key={session.sessionKey} session={session} token={token}
            onDone={() => setData(previous => previous && ({
              total: previous.total - 1,
              items: previous.items.filter(item => item.sessionKey !== session.sessionKey),
            }))} />
        ))}
      </ul>
      <Link href="/account/schedule" className="mt-1 inline-block text-sm font-bold text-blue no-underline">
        {remaining > 0 ? `Còn ${remaining} buổi khác, xem lịch đầy đủ` : 'Xem lịch đầy đủ'}
      </Link>
    </section>
  )
}
