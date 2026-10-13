'use client'

import {
  AttendedControl, DirectionsLink, JoinControl, RequestControl, type ActionContext,
} from './SessionButtons'
import {
  countdownText, dayLabel, formatClock, formatDayMonth, modeLabel, weekdayLong,
} from '@/lib/today/format'
import type { SessionView, TodayData } from '@/lib/today/types'
import Link from 'next/link'
import { BROWSE_HOME_URL } from '@/lib/today/links'

const CARD = 'rounded-[20px] border border-line bg-white p-4'
const LABEL = 'text-xs font-bold uppercase tracking-wide'

function teacherLine(session: SessionView): string {
  const parts = [session.teacherName]
  const place = session.location?.name ?? session.location?.address
  if (session.mode === 'onsite' && place) parts.push(place)
  return parts.filter(Boolean).join(' · ')
}

function placeDetail(session: SessionView): string {
  const room = session.location?.roomNote
  const address = session.location?.address
  return [room, address].filter(Boolean).join(' · ')
}

export function NextSessionCard({ data, ctx, now }: { data: TodayData; ctx: ActionContext; now: Date }) {
  const session = data.nextSession

  if (!session) {
    return (
      <section className="rounded-[20px] bg-blue p-5 text-white">
        <p className={`${LABEL} text-white/70`}>Buổi kế tiếp</p>
        <p className="mt-3 text-xl font-black">Chưa có buổi học sắp tới</p>
        <p className="mt-1 text-sm text-white/80">Khi có lịch mới, buổi học sẽ hiện ở đây.</p>
        <Link href={BROWSE_HOME_URL} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[15px] font-black text-blue">
          Tìm khóa học mới
        </Link>
      </section>
    )
  }

  const subject = data.learner.self ? 'bạn' : 'bé'
  const detail = placeDetail(session)

  return (
    <section className="rounded-[20px] bg-blue p-5 text-white">
      {data.freeToday && (
        <p className="mb-3 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold">
          Hôm nay {subject} được nghỉ. Buổi kế tiếp là {dayLabel(session.startAt, now).toLowerCase()}.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${LABEL} text-white/75`}>Buổi kế tiếp</span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">{modeLabel(session)}</span>
        <span className="ml-auto rounded-full bg-white px-3 py-1 text-xs font-black text-blue">
          {countdownText(session.startAt, session.endAt, now)}
        </span>
      </div>

      <div className="mt-3 lg:flex lg:items-start lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <p className="text-5xl font-black leading-none">{formatClock(session.startAt)}</p>
          {data.freeToday && <p className="mt-2 text-sm font-semibold text-white/85">{weekdayLong(session.startAt)} {formatDayMonth(session.startAt)}</p>}
          <h2 className="mt-3 text-2xl font-black leading-snug">{session.title}</h2>
          <p className="mt-1 text-sm text-white/80">{teacherLine(session)}</p>
          {detail && <p className="text-sm text-white/80">{detail}</p>}
        </div>
        {session.mode === 'onsite' && (
          <div className="mt-4 hidden min-h-[120px] w-52 shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/50 bg-white/10 p-3 text-center text-sm lg:flex">
            <span className="font-bold">Địa điểm</span>
            <span className="mt-1 text-white/85">{session.location?.address ?? 'Chưa có địa chỉ'}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DirectionsLink location={session.mode === 'online' ? null : session.location} tone="light" />
        <JoinControl session={session} learnerId={ctx.learnerId} now={now} />
        <AttendedControl session={session} ctx={ctx} now={now} tone="light" />
        <RequestControl session={session} ctx={ctx} tone="light" label="Xin nghỉ / đổi lịch" />
      </div>
    </section>
  )
}

export function LaterTodayCard({ sessions, ctx, now }: { sessions: SessionView[]; ctx: ActionContext; now: Date }) {
  if (sessions.length === 0) return null
  return (
    <section className={`${CARD} space-y-4`}>
      {sessions.map(session => (
        <div key={session.key}>
          <div className="flex items-center justify-between">
            <span className={`${LABEL} text-muted`}>Cuối ngày</span>
            <span className="rounded-full bg-green-soft px-2.5 py-0.5 text-xs font-bold text-green-dark">{modeLabel(session)}</span>
          </div>
          <h3 className="mt-1 text-base font-black text-ink">{formatClock(session.startAt)} · {session.title}</h3>
          <p className="text-sm text-muted">
            {session.mode === 'online' ? 'Qua Zoom · ' : ''}{teacherLine(session)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <JoinControl session={session} learnerId={ctx.learnerId} now={now} />
            <AttendedControl session={session} ctx={ctx} now={now} tone="dark" />
            <RequestControl session={session} ctx={ctx} tone="dark" />
          </div>
        </div>
      ))}
    </section>
  )
}

export function ExtraCard({ sessions, ctx, now }: { sessions: SessionView[]; ctx: ActionContext; now: Date }) {
  if (sessions.length === 0) return null
  return (
    <>
      {sessions.map(session => (
        <section key={session.key} className="rounded-[20px] border border-green/30 bg-green-soft p-4">
          <div className="flex items-center justify-between">
            <span className={`${LABEL} text-green-dark`}>
              Sắp tới · {dayLabel(session.startAt, now)}
            </span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-green-dark">Ngoại khóa</span>
          </div>
          <h3 className="mt-1 text-base font-black text-ink">{session.title}</h3>
          <p className="text-sm text-muted">
            {session.gatherTime ? `Tập trung ${session.gatherTime} · ` : ''}Bắt đầu {formatClock(session.startAt)}
            {session.location?.address ? ` · ${session.location.address}` : ''}
          </p>
          {session.bringItems && (
            <p className="mt-2 text-sm text-ink"><strong>Cần mang theo:</strong> {session.bringItems}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DirectionsLink location={session.location} tone="dark" />
            <AttendedControl session={session} ctx={ctx} now={now} tone="dark" />
            <RequestControl session={session} ctx={ctx} tone="dark" />
          </div>
        </section>
      ))}
    </>
  )
}
