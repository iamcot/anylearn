'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
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

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun/farm" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Nông trại của tôi</Link>
      <h1 className="m-0 text-2xl font-black">Vườn của {visit.name}</h1>
      <p className="mt-1 text-sm text-muted">Cấp {visit.level}{visit.hasDog ? ' · có chó giữ vườn 🐕' : ''} · còn {visit.helpLeft} lượt giúp{visit.allowSteal ? `, ${visit.stealLeft} lượt hái hoa` : ''} hôm nay</p>
      {note && <p className="mt-2 rounded-xl bg-green-soft px-3 py-2 text-sm font-bold text-green-dark" role="status">{note}</p>}

      <div className="mt-3 grid grid-cols-2 gap-3">
        {visit.plots.map(p => (
          <div key={p.slot} className="flex min-h-[132px] flex-col items-center justify-between rounded-2xl bg-[#f3e3c7] p-3 ring-1 ring-[#d9c29b]">
            <div className="text-5xl" aria-hidden>{p.phase === 'empty' ? '🟫' : p.phase === 'ripe' ? (p.emoji ?? '🌸') : p.phase === 'thirsty' ? '🥀' : '🌱'}</div>
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
  )
}
