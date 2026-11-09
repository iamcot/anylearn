/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import { backgroundFor, farmImg, plotImage, timeOfDay } from '@/lib/farm/art'
import { fertilizeNeighbor, stealFlower, visitFarm, waterNeighbor, type FarmVisit } from '@/lib/api/farm'

export default function VisitFarmPage() {
  const { token } = useAuth()
  const params = useParams<{ id: string }>()
  const ownerId = Number(params.id)
  const [visit, setVisit] = useState<FarmVisit | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    const { data, error: err } = await visitFarm(token, ownerId)
    if (err || !data) return setError(err ?? 'Không mở được vườn này')
    setError('')
    setVisit(data)
  }, [token, ownerId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function act(run: () => Promise<{ error?: string; data?: unknown }>, ok: (d: unknown) => string) {
    if (busy) return
    setBusy(true)
    const r = await run()
    setBusy(false)
    setNote(r.error ?? ok(r.data))
    await load()
  }

  if (!token) return null
  if (error) return <div className="mx-auto max-w-[720px] px-4 pt-6"><Link href="/fun/farm" className="text-sm font-bold">‹ Nông trại</Link><p className="mt-3 text-warn-text" role="alert">{error}</p></div>
  if (!visit) return <div className="mx-auto max-w-[720px] px-4 pt-6"><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /></div>

  const thirsty = visit.plots.filter(p => p.needsWater).map(p => p.slot)

  const tod = timeOfDay(new Date().getHours())
  const bgStyle = { '--bgm': `url(${backgroundFor(tod, 'mobile')})`, '--bgd': `url(${backgroundFor(tod, 'desktop')})` } as React.CSSProperties

  return (
    <div className="min-h-screen bg-[image:var(--bgm)] bg-cover bg-top bg-no-repeat lg:bg-[image:var(--bgd)]" style={bgStyle}>
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun/farm" className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/80 px-3 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Nông trại của tôi</Link>
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white/85 p-3 ring-1 ring-white">
        {visit.hasDog && <img src={farmImg('npc_cho_bong')} alt="Chó giữ vườn" className="size-16 shrink-0 object-contain" />}
        <div>
          <h1 className="m-0 text-xl font-black">Vườn của {visit.name}</h1>
          <p className="m-0 text-sm text-muted">Cấp {visit.level}{visit.hasDog ? ' · có chó giữ vườn' : ''} · còn {visit.helpLeft} lượt giúp{visit.allowSteal ? `, ${visit.stealLeft} lượt hái hoa` : ''} hôm nay</p>
        </div>
      </div>
      {note && <p className="mt-2 rounded-xl bg-green-soft px-3 py-2 text-sm font-bold text-green-dark" role="status">{note}</p>}

      <div className="mt-3 grid grid-cols-2 gap-3">
        {visit.plots.map(p => (
          <div key={p.slot} className="flex flex-col items-center rounded-2xl bg-white/75 p-2 ring-1 ring-white">
            <div className="relative aspect-[3/2] w-full">
              <img src={plotImage(p)} alt="" className="absolute inset-0 size-full object-contain" />
              {p.phase !== 'empty' && <div className="absolute inset-0 flex items-center justify-center pb-4 text-5xl" aria-hidden>{p.phase === 'ripe' ? (p.emoji ?? '🌸') : p.phase === 'thirsty' ? '🥀' : '🌱'}</div>}
              {p.needsWater && <img src={farmImg('icon_thirsty')} alt="Khát nước" className="absolute right-0 top-0 size-12 object-contain" />}
            </div>
            <div className="text-center text-sm font-black">{p.name ?? 'Ô đất trống'}</div>
            {p.needsWater && <button type="button" className="btn btn--green min-h-10 w-full" disabled={busy || visit.helpLeft <= 0} onClick={() => act(() => waterNeighbor(token, ownerId, [p.slot]), () => 'Đã tưới giúp, nhận XP')}>💧 Tưới giúp</button>}
            {!p.needsWater && p.phase === 'growing' && !p.fertilized && (
              <button type="button" className="min-h-9 w-full cursor-pointer rounded-lg border-0 bg-white text-xs font-extrabold ring-1 ring-line" disabled={busy || visit.helpLeft <= 0} onClick={() => act(() => fertilizeNeighbor(token, ownerId, p.slot), () => 'Đã bón phân giúp')}>Bón phân giúp</button>
            )}
            {visit.allowSteal && p.pickable && (
              <button type="button" className="mt-1 min-h-9 w-full cursor-pointer rounded-lg border-0 bg-white text-xs font-extrabold ring-1 ring-line" disabled={busy || visit.stealLeft <= 0} onClick={() => act(() => stealFlower(token, ownerId, p.slot), d => (d as { message: string }).message)}>🌸 Hái trộm</button>
            )}
          </div>
        ))}
      </div>
      {thirsty.length > 1 && (
        <button type="button" className="btn btn--green mt-3 min-h-11 w-full" disabled={busy || visit.helpLeft <= 0} onClick={() => act(() => waterNeighbor(token, ownerId, thirsty), () => 'Đã tưới giúp các ô khát')}>💧 Tưới giúp tất cả ({thirsty.length})</button>
      )}
    </div>
    </div>
  )
}
