'use client'

import { useState } from 'react'
import { claimCheckin, type CheckinStatus } from '@/lib/api/fun'
import { afterClaim, claimMessage, giftNote } from '@/lib/fun/checkin'

// "Any", the mascot drawn from the anyLEARN logo: the round "a" with one square corner and the blue book inside.
// It walks back and forth on the hill (CSS in globals.css); the body is a gradient so it reads as a soft 3D toy.
function Mascot() {
  return (
    <g transform="translate(58 100)">
      <g className="mascot-walk">
        <ellipse cx="0" cy="52" rx="24" ry="4.5" fill="#000" opacity=".14" />
        <g className="mascot-bob">
          <g className="mascot-leg-a"><rect x="-13" y="42" width="10" height="10" rx="5" fill="#007a3c" /></g>
          <g className="mascot-leg-b"><rect x="3" y="42" width="10" height="10" rx="5" fill="#007a3c" /></g>
          <g className="mascot-arm-a"><ellipse cx="-24" cy="26" rx="5" ry="8" fill="#00a551" /></g>
          <g className="mascot-arm-b"><ellipse cx="24" cy="26" rx="5" ry="8" fill="#00a551" /></g>
          <defs>
            <linearGradient id="mascotBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4fe39a" /><stop offset=".55" stopColor="#00a551" /><stop offset="1" stopColor="#007a3c" />
            </linearGradient>
            <radialGradient id="mascotShine" cx=".3" cy=".25" r=".5">
              <stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d="M-22 16A20 20 0 0 1-2-4L2-4A20 20 0 0 1 22 16L22 41Q22 44 19 44L-8 44A14 14 0 0 1-22 30Z" fill="url(#mascotBody)" />
          <ellipse cx="-9" cy="6" rx="13" ry="10" fill="url(#mascotShine)" />
          <g>
            <circle cx="-8" cy="14" r="6.5" fill="#fff" /><circle cx="8" cy="14" r="6.5" fill="#fff" />
            <g className="mascot-eyes"><circle cx="-7" cy="15" r="3.2" fill="#14342a" /><circle cx="9" cy="15" r="3.2" fill="#14342a" />
              <circle cx="-6" cy="13.8" r="1" fill="#fff" /><circle cx="10" cy="13.8" r="1" fill="#fff" /></g>
          </g>
          <ellipse cx="-15" cy="23" rx="3.5" ry="2.2" fill="#ff8fa3" opacity=".7" /><ellipse cx="15" cy="23" rx="3.5" ry="2.2" fill="#ff8fa3" opacity=".7" />
          <path d="M-4 24Q0 28 4 24" fill="none" stroke="#14342a" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M-9 33L0 36L0 43L-9 40Z" fill="#0099d4" /><path d="M9 33L0 36L0 43L9 40Z" fill="#006fa8" />
        </g>
      </g>
    </g>
  )
}

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

      <div className="relative h-[210px]">
        <svg viewBox="0 0 360 170" preserveAspectRatio="xMidYMax meet" className="absolute inset-x-0 bottom-0 h-auto w-full" aria-hidden>
          <circle cx="300" cy="40" r="18" fill="#ffd166" />
          <path d="M0 120 Q90 80 190 115 T360 105 V170 H0Z" fill="#9bd77f" />
          <path d="M0 140 Q120 110 230 140 T360 135 V170 H0Z" fill="#6cbf5a" />
          <g transform="translate(250 92)"><rect x="0" y="12" width="34" height="24" fill="#e76f51" /><path d="M-4 14 L17 -2 L38 14Z" fill="#9c3d2a" /><rect x="13" y="22" width="9" height="14" fill="#fff3e0" /></g>
          <Mascot />
        </svg>
        <button type="button" onClick={open} disabled={!canOpen || busy}
          className="absolute left-3 top-3 flex min-h-11 min-w-11 cursor-pointer flex-col items-center rounded-2xl border-0 bg-white/85 px-3 py-2 text-xs font-bold text-ink disabled:cursor-default">
          <span className={`inline-block text-5xl leading-none ${opening ? 'gift-shake' : canOpen ? 'gift-wobble' : 'opacity-60'}`} aria-hidden>🎁</span>
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
