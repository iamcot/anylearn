'use client'

import { useState } from 'react'
import { claimCheckin, type CheckinStatus } from '@/lib/api/fun'
import { afterClaim, claimMessage, giftNote } from '@/lib/fun/checkin'

// The Vui học landing: a small scene with the owl, the week of the streak and the daily gift box.
export default function FunScene({ token, initial, onClaimed }: { token: string; initial: CheckinStatus; onClaimed?: () => void }) {
  const [status, setStatus] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [opening, setOpening] = useState(false)
  const [reward, setReward] = useState(0)

  const open = async () => {
    if (busy || status.claimedToday || !status.enabled) return
    setBusy(true)
    setOpening(true)
    // the box shakes at least 0.6 s so the person sees it open, even when the answer is quick
    const [{ data, error }] = await Promise.all([claimCheckin(token), new Promise(resolve => setTimeout(resolve, 600))])
    setBusy(false)
    setOpening(false)
    if (error || !data) { setMessage(error ?? 'Không mở được quà, thử lại sau'); return }
    setMessage(claimMessage(data))
    if (data.points > 0) setReward(data.points)
    setStatus(prev => afterClaim(prev, data))
    onClaimed?.()
  }

  const canOpen = status.enabled && !status.claimedToday

  return (
    <section className="overflow-hidden rounded-[22px] border-[3px] border-green-soft bg-gradient-to-b from-[#9fd8f5] to-[#e6f6ff]" aria-label="Quà điểm danh">
      <div className="flex items-center gap-2 px-3 pt-3 text-xs font-bold text-[#7c2d12]">
        <span className="rounded-full bg-white/75 px-3 py-1.5">🔥 {status.streak} ngày</span>
        <div className="flex flex-1 items-center gap-1.5 rounded-full bg-white/75 px-3 py-2" aria-label={`Ngày ${status.dayInCycle} trong tuần`}>
          {status.days.map(d => (
            <span key={d.day} title={`Ngày ${d.day}: ${d.points} anyPoint`}
              className={`h-2 flex-1 rounded-full ${d.state === 'done' ? 'bg-[#fb923c]' : d.state === 'today' ? 'bg-[#f97316] ring-2 ring-[#fed7aa]' : 'bg-black/10'}`} />
          ))}
        </div>
        <span aria-hidden>🎁</span>
      </div>

      <div className="relative h-[190px]">
        <svg viewBox="0 0 360 170" preserveAspectRatio="xMidYMax meet" className="absolute inset-x-0 bottom-0 h-auto w-full" aria-hidden>
          <circle cx="300" cy="40" r="18" fill="#ffd166" />
          <path d="M0 120 Q90 80 190 115 T360 105 V170 H0Z" fill="#9bd77f" />
          <path d="M0 140 Q120 110 230 140 T360 135 V170 H0Z" fill="#6cbf5a" />
          <g transform="translate(250 92)"><rect x="0" y="12" width="34" height="24" fill="#e76f51" /><path d="M-4 14 L17 -2 L38 14Z" fill="#9c3d2a" /><rect x="13" y="22" width="9" height="14" fill="#fff3e0" /></g>
          <g transform="translate(70 92)"><ellipse cx="0" cy="26" rx="22" ry="26" fill="#a0785a" /><ellipse cx="0" cy="34" rx="14" ry="16" fill="#f3dfc1" /><circle cx="-9" cy="14" r="9" fill="#fff" /><circle cx="9" cy="14" r="9" fill="#fff" /><circle cx="-8" cy="15" r="4" fill="#2b2b2b" /><circle cx="10" cy="15" r="4" fill="#2b2b2b" /><path d="M-3 22 L3 22 L0 27Z" fill="#f4a261" /><path d="M-20 2 L-14 -8 L-8 4Z M20 2 L14 -8 L8 4Z" fill="#a0785a" /></g>
        </svg>
        <button type="button" onClick={open} disabled={!canOpen || busy}
          className="absolute left-3 top-3 flex min-h-11 min-w-11 cursor-pointer flex-col items-center rounded-2xl border-0 bg-white/85 px-2 py-1.5 text-[10px] font-bold text-ink disabled:cursor-default">
          <span className={`inline-block text-3xl ${opening ? 'gift-shake' : canOpen ? 'gift-wobble' : 'opacity-60'}`} aria-hidden>🎁</span>
          {canOpen ? 'Mở quà' : 'Đã nhận'}
        </button>
        {reward > 0 && (
          <div className="gift-fly pointer-events-none absolute left-4 top-16 text-xl font-black text-[#b45309]" aria-hidden>+{reward} anyPoint</div>
        )}
        <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white/90 px-3 py-1.5 text-center text-xs text-ink" role="status">
          {message ? <b className="text-green-dark">{message}</b> : giftNote(status)}
        </div>
      </div>
    </section>
  )
}
