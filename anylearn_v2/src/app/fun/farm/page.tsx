'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import BrandText from '@/components/fun/BrandText'
import CoinIcon from '@/components/fun/CoinIcon'
import {
  buyFertilizer, collectCompost, expandPlots, fertilizePlot, getFarm, getProgress, harvestPlots, plantCrop, sellCrops, startCompost, waterPlots,
  type FarmCrop, type FarmPlot, type FarmProgress, type FarmView,
} from '@/lib/api/farm'
import OrdersTab from '@/components/fun/farm/OrdersTab'
import QuestsTab from '@/components/fun/farm/QuestsTab'
import NeighborsTab from '@/components/fun/farm/NeighborsTab'
import { capUsedPercent, formatWait, isRipe, secondsUntil, sellable, seedCount, slotsToHarvest, slotsToWater } from '@/lib/farm/rules'

const PHASE_EMOJI: Record<string, string> = { growing: '🌱', thirsty: '🥀', ripe: '✨', wilting: '🍂' }

export default function FarmPage() {
  const { token } = useAuth()
  const [view, setView] = useState<FarmView | null>(null)
  const [progress, setProgress] = useState<FarmProgress | null>(null)
  const [tab, setTab] = useState<'garden' | 'orders' | 'quests' | 'neighbors'>('garden')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [pick, setPick] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadedAt, setLoadedAt] = useState(0)
  const [now, setNow] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    const [{ data, error: err }, { data: prog }] = await Promise.all([getFarm(token), getProgress(token)])
    if (err || !data) return setError(err ?? 'Không tải được nông trại')
    setError('')
    setView(data)
    if (prog) setProgress(prog)
    setLoadedAt(Date.now())
    setNow(Date.now())
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  // redraw the countdowns every second and ask the server again every 20 seconds (a plant may have ripened or got thirsty)
  useEffect(() => {
    let n = 0
    const id = setInterval(() => {
      setNow(Date.now())
      n += 1
      if (n % 20 === 0) load()
    }, 1000)
    return () => clearInterval(id)
  }, [load])

  const elapsed = Math.max(now - loadedAt, 0)

  async function act(run: () => Promise<{ error?: string; data?: unknown }>, ok: string) {
    if (busy) return
    setBusy(true)
    const { error: err } = await run()
    setBusy(false)
    if (err) { setNote(err); return }
    if (ok) setNote(ok)
    await load()
  }

  if (!token) return null
  if (error) return <div className="mx-auto max-w-[720px] px-4 pt-6"><p className="text-warn-text" role="alert">{error}</p></div>
  if (!view || !progress) return <div className="mx-auto max-w-[720px] px-4 pt-6"><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /></div>

  const cropOf = (k?: string) => view.crops.find(c => c.cropKey === k)
  const toWater = slotsToWater(view.plots)
  const toHarvest = slotsToHarvest(view.plots)
  const sell = sellable(view)
  const used = capUsedPercent(view.market.room, view.market.dayCap)

  async function plant(crop: FarmCrop) {
    if (pick === null || !token) return
    const slot = pick
    setPick(null)
    await act(() => plantCrop(token, slot, crop.cropKey), `Đã gieo ${crop.name}`)
  }

  function plotLabel(p: FarmPlot) {
    if (p.phase === 'empty') return 'Trống'
    if (p.phase === 'ripe') return 'Chín rồi!'
    if (p.phase === 'wilting') return 'Sắp héo'
    if (p.phase === 'thirsty') return 'Khát nước'
    return formatWait((p.secondsToRipe ?? 0) - elapsed / 1000)
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-2xl font-black lg:text-3xl">Nông trại anyLEARN</h1>
        <span className="inline-flex items-center gap-1.5 text-xl font-black text-[#b45309]" title={view.coinName}><CoinIcon className="size-6" /> {view.balance}</span>
      </div>
      <p className="mt-1 text-sm text-muted">Cấp vườn <b>{view.level}</b> · {view.xpForNext > 0 ? `${view.xpIntoLevel}/${view.xpForNext} XP` : 'cấp tối đa'}</p>
      {note && <p className="mt-2 rounded-xl bg-green-soft px-3 py-2 text-sm font-bold text-green-dark" role="status">{note}</p>}

      <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
        {([['garden', 'Vườn'], ['orders', 'Đơn hàng'], ['quests', 'Nhiệm vụ'], ['neighbors', 'Hàng xóm']] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`min-h-10 cursor-pointer rounded-lg border-0 text-xs font-extrabold ${tab === k ? 'bg-white text-green-dark shadow-sm' : 'bg-transparent text-muted'}`}>{l}</button>
        ))}
      </div>
      {tab === 'orders' && <OrdersTab token={token} view={view} progress={progress} busy={busy} run={act} setNote={setNote} />}
      {tab === 'quests' && <QuestsTab token={token} view={view} progress={progress} busy={busy} run={act} setNote={setNote} />}
      {tab === 'neighbors' && <NeighborsTab token={token} view={view} onChanged={load} />}
      {tab === 'garden' && <>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {view.plots.map(p => {
          const crop = cropOf(p.cropKey)
          const waterSecs = p.nextWaterAt ? secondsUntil(p.nextWaterAt, view.serverNow, elapsed) : 0
          return (
            <div key={p.slot} className="flex min-h-[148px] flex-col items-center justify-between rounded-2xl bg-[#f3e3c7] p-3 ring-1 ring-[#d9c29b]">
              <div className="text-5xl" aria-hidden>{p.phase === 'empty' ? '🟫' : (p.phase === 'ripe' ? crop?.emoji : PHASE_EMOJI[p.phase]) ?? '🌱'}</div>
              <div className="text-center text-sm font-black">{crop?.name ?? 'Ô đất trống'}</div>
              <div className="text-xs font-bold text-muted">{plotLabel(p)}{p.phase === 'growing' && p.waterNeeds && (p.watersDone ?? 0) < p.waterNeeds ? ` · tưới sau ${formatWait(waterSecs)}` : ''}</div>
              {p.phase === 'empty' && <button type="button" className="btn btn--green min-h-11 w-full" onClick={() => setPick(p.slot)}>Gieo hạt</button>}
              {p.phase === 'thirsty' && <button type="button" className="btn btn--green min-h-11 w-full" disabled={busy} onClick={() => act(() => waterPlots(token, [p.slot]), 'Đã tưới')}>💧 Tưới</button>}
              {(p.phase === 'growing' || p.phase === 'thirsty') && !p.fertilized && (view.inventory.fertilizer ?? 0) > 0 && (
                <button type="button" className="mt-1 min-h-9 w-full cursor-pointer rounded-lg border-0 bg-white text-xs font-extrabold text-ink ring-1 ring-line" disabled={busy} onClick={() => act(() => fertilizePlot(token, p.slot), 'Đã bón phân, +1 quả')}>Bón phân ({view.inventory.fertilizer})</button>
              )}
              {isRipe(p) && <button type="button" className="btn btn--green min-h-11 w-full" disabled={busy} onClick={() => act(() => harvestPlots(token, [p.slot]), `Thu hoạch ${p.yield} quả`)}>Thu {p.yield} quả</button>}
            </div>
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className="btn btn--green min-h-11" disabled={busy || toWater.length === 0} onClick={() => act(() => waterPlots(token, toWater), `Đã tưới ${toWater.length} ô`)}>💧 Tưới tất cả ({toWater.length})</button>
        <button type="button" className="btn btn--green min-h-11" disabled={busy || toHarvest.length === 0} onClick={() => act(() => harvestPlots(token, toHarvest), `Đã thu ${toHarvest.length} ô`)}>🧺 Thu tất cả ({toHarvest.length})</button>
      </div>

      {view.nextPlotPrice > 0 && (
        <button type="button" className="mt-3 min-h-11 w-full cursor-pointer rounded-xl border-0 bg-white text-sm font-extrabold text-ink ring-1 ring-line disabled:opacity-50" disabled={busy || view.level < view.nextPlotLevel} onClick={() => act(() => expandPlots(token), 'Đã mở thêm ô đất')}>
          Mở thêm ô đất · {view.nextPlotPrice} {view.coinName}{view.level < view.nextPlotLevel ? ` (cấp ${view.nextPlotLevel})` : ''}
        </button>
      )}

      <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line" aria-label="Thùng ủ phân">
        <h2 className="m-0 text-lg font-black">Thùng ủ phân</h2>
        {progress.compost.active ? (
          progress.compost.active.ready
            ? <button type="button" className="btn btn--green mt-2 min-h-11 w-full" disabled={busy} onClick={() => act(() => collectCompost(token), 'Đã nhận phân bón')}>Nhận phân bón</button>
            : <p className="mt-1 text-sm text-muted">Đang ủ, xong lúc {new Date(progress.compost.active.readyAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.</p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted">Bỏ {progress.compost.units} nông sản vào thùng, sau {formatWait(progress.compost.minutes * 60)} nhận 1 phân bón.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sell.filter(s => s.qty >= progress.compost.units).map(s => (
                <button key={s.cropKey} type="button" className="min-h-9 cursor-pointer rounded-lg border-0 bg-white px-3 text-xs font-extrabold ring-1 ring-line" disabled={busy} onClick={() => act(() => startCompost(token, s.cropKey), 'Đã bỏ vào thùng ủ')}>{cropOf(s.cropKey)?.emoji} {cropOf(s.cropKey)?.name}</button>
              ))}
              {sell.every(s => s.qty < progress.compost.units) && <span className="text-xs text-muted">Chưa đủ nông sản để ủ.</span>}
            </div>
          </>
        )}
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line" aria-label="Chợ">
        <h2 className="m-0 text-lg font-black">Chợ</h2>
        <p className="mt-1 text-xs text-muted">
          Chợ mua tối đa <b>{view.market.room}</b> <BrandText text={view.coinName} coinName={view.coinName} /> lãi nữa hôm nay.
          Lãi = tiền bán trừ tiền mua hạt và phân; nông sản chưa bán được vẫn giữ trong kho.
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-green" style={{ width: `${used}%` }} /></div>
        {sell.length === 0 ? <p className="mt-3 text-sm text-muted">Kho chưa có nông sản. Thu hoạch xong quay lại đây nhé.</p> : (
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {sell.map(s => {
              const c = cropOf(s.cropKey)
              const price = view.market.prices.find(x => x.cropKey === s.cropKey)
              return (
                <li key={s.cropKey} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{c?.emoji} {c?.name} × {s.qty}</span>
                  <span className="text-xs text-muted">{price?.price} xu/quả{price && price.nextPercent < 100 ? ` (${price.nextPercent}%)` : ''}</span>
                  <button type="button" className="min-h-9 cursor-pointer rounded-lg border-0 bg-green px-3 text-xs font-extrabold text-white" disabled={busy} onClick={() => act(async () => {
                    const r = await sellCrops(token, { [s.cropKey]: s.qty })
                    if (r.data) setNote(r.data.coins > 0 ? `Bán được ${r.data.coins} ${view.coinName}${r.data.capped ? ', chợ hết lãi cho hôm nay nên còn lại trong kho' : ''}` : 'Chợ hôm nay đã đủ lãi, ngày mai bán tiếp nhé')
                    return r
                  }, '')}>Bán hết</button>
                </li>
              )
            })}
          </ul>
        )}
        <button type="button" className="mt-4 min-h-11 w-full cursor-pointer rounded-xl border-0 bg-white text-sm font-extrabold text-ink ring-1 ring-line" disabled={busy} onClick={() => act(() => buyFertilizer(token, 1), 'Đã mua 1 phân bón')}>
          Mua 1 phân bón · {view.fertilizerPrice} {view.coinName}
        </button>
      </section>

      </>}

      {pick !== null && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:items-center lg:justify-center" role="dialog" aria-modal="true" aria-label="Chọn hạt">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 lg:max-w-md lg:rounded-3xl">
            <div className="flex items-center justify-between"><h2 className="m-0 text-lg font-black">Chọn hạt giống</h2><button type="button" className="min-h-11 cursor-pointer border-0 bg-transparent text-sm font-bold" onClick={() => setPick(null)}>Đóng</button></div>
            <ul className="m-0 mt-2 list-none space-y-2 p-0">
              {view.crops.map(c => {
                const have = seedCount(view, c.cropKey)
                return (
                  <li key={c.cropKey}>
                    <button type="button" disabled={c.locked || busy} onClick={() => plant(c)} className="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-slate-50 p-2 text-left ring-1 ring-line disabled:opacity-50">
                      <span className="text-3xl" aria-hidden>{c.emoji}</span>
                      <span className="flex-1"><b className="block text-sm">{c.name}</b><span className="text-xs text-muted">{formatWait(c.growMinutes * 60)} · tưới {c.waterNeeds} lần · {c.baseYield} quả</span></span>
                      <span className="text-xs font-extrabold">{c.locked ? `Cấp ${c.unlockLevel}` : have > 0 ? `Có ${have} hạt` : `${c.seedPrice} xu`}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
