'use client'

import Link from 'next/link'
import { useState } from 'react'
import { markAttended, requestChange } from '@/lib/today/api'
import { canJoinNow, formatClock, hasStarted, mapsUrl, upperFirst } from '@/lib/today/format'
import type { LocationView, RequestType, SessionView } from '@/lib/today/types'

export interface ActionContext {
  learnerId: number
  isSelf: boolean
  token: string
  onChanged: () => void
}

type Tone = 'light' | 'dark'

const REQUEST_LABEL: Record<RequestType, string> = {
  leave: 'xin nghỉ',
  reschedule: 'đổi lịch',
  makeup: 'học bù',
}

const BUTTON = 'inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[15px] font-black transition hover:-translate-y-px'
const TONE_PRIMARY: Record<Tone, string> = {
  light: 'bg-white text-blue hover:bg-white/90',
  dark: 'bg-green text-white hover:bg-green-dark',
}
const TONE_SECOND: Record<Tone, string> = {
  light: 'border border-white/50 text-white hover:bg-white/10',
  dark: 'border border-blue/40 text-blue hover:bg-blue/5',
}

export function DirectionsLink({ location, tone }: { location: LocationView | null; tone: Tone }) {
  const url = mapsUrl(location)
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${BUTTON} ${TONE_PRIMARY[tone]}`}>
      Chỉ đường
    </a>
  )
}

export function JoinControl({ session, learnerId, now }: { session: SessionView; learnerId: number; now: Date }) {
  if (session.mode !== 'online') return null
  if (canJoinNow(session, now)) {
    return (
      <Link href={`/join/${session.key}?child=${learnerId}`} className={`${BUTTON} bg-green text-white hover:bg-green-dark`}>
        Vào lớp
      </Link>
    )
  }
  const opensAt = session.joinOpensAt ? formatClock(session.joinOpensAt) : ''
  return (
    <span className={`${BUTTON} cursor-not-allowed bg-line text-muted`} aria-disabled="true">
      Mở lúc {opensAt}
    </span>
  )
}

export function AttendedControl({ session, ctx, now, tone }: { session: SessionView; ctx: ActionContext; now: Date; tone: Tone }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (session.mode === 'online' || !hasStarted(session, now)) return null
  if (session.attended) {
    return <span className={`inline-flex min-h-11 items-center text-sm font-bold ${tone === 'light' ? 'text-white' : 'text-green-dark'}`}>✓ Đã đi học</span>
  }

  async function handleClick() {
    setSaving(true)
    setError('')
    const { error: err } = await markAttended(ctx.learnerId, session.key, ctx.token)
    setSaving(false)
    if (err) return setError(err)
    ctx.onChanged()
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={saving} className={`${BUTTON} ${TONE_PRIMARY[tone]}`}>
        {ctx.isSelf ? 'Mình đã đi học' : 'Bé đã đi học'}
      </button>
      {error && <p className="mt-1 text-xs">{error}</p>}
    </div>
  )
}

export function RequestControl({ session, ctx, tone, label = 'Xin nghỉ' }: { session: SessionView; ctx: ActionContext; tone: Tone; label?: string }) {
  const [open, setOpen] = useState(false)

  if (session.pendingRequest) {
    return (
      <span className={`inline-flex min-h-11 items-center text-sm font-semibold ${tone === 'light' ? 'text-white/90' : 'text-muted'}`}>
        Đã gửi yêu cầu {REQUEST_LABEL[session.pendingRequest]}
      </span>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${BUTTON} ${TONE_SECOND[tone]}`}>
        {label}
      </button>
      {open && <RequestDialog session={session} ctx={ctx} onClose={() => setOpen(false)} />}
    </>
  )
}

function RequestDialog({ session, ctx, onClose }: { session: SessionView; ctx: ActionContext; onClose: () => void }) {
  const [type, setType] = useState<RequestType>('leave')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    setSaving(true)
    setError('')
    const { error: err } = await requestChange(ctx.learnerId, session.key, type, note.trim(), ctx.token)
    setSaving(false)
    if (err) return setError(err)
    setSent(true)
    ctx.onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 text-ink lg:rounded-3xl">
        <h2 className="text-lg font-black">Xin nghỉ / đổi lịch</h2>
        <p className="mt-1 text-sm text-muted">{session.title} · {formatClock(session.startAt)}</p>

        {sent ? (
          <>
            <p className="mt-4 rounded-xl bg-green-soft p-3 text-sm font-semibold text-green-dark">
              Đã gửi yêu cầu. anyLEARN sẽ liên hệ với bạn sớm.
            </p>
            <button type="button" onClick={onClose} className={`${BUTTON} mt-4 w-full bg-blue text-white`}>Đóng</button>
          </>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Loại yêu cầu">
              {(Object.keys(REQUEST_LABEL) as RequestType[]).map(option => (
                <button
                  key={option} type="button" role="radio" aria-checked={type === option} onClick={() => setType(option)}
                  className={`min-h-11 rounded-xl border px-2 text-sm font-bold ${type === option ? 'border-blue bg-blue text-white' : 'border-line text-ink'}`}
                >
                  {upperFirst(REQUEST_LABEL[option])}
                </button>
              ))}
            </div>
            <textarea
              value={note} onChange={event => setNote(event.target.value)} maxLength={500} rows={3}
              placeholder="Lý do (không bắt buộc)"
              className="mt-3 w-full rounded-xl border border-line p-3 text-sm outline-none focus:border-blue"
            />
            {error && <p className="mt-2 text-sm text-warn-text">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={onClose} className={`${BUTTON} flex-1 border border-line text-ink`}>Hủy</button>
              <button type="button" onClick={handleSubmit} disabled={saving} className={`${BUTTON} flex-1 bg-blue text-white`}>
                {saving ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
