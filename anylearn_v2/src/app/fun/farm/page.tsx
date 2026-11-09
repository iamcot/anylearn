/* eslint-disable @next/next/no-img-element */
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
import FarmScene from '@/components/fun/farm/FarmScene'
import { farmImg, timeOfDay } from '@/lib/farm/art'
import type { SceneKind } from '@/lib/farm/scene'
import { capUsedPercent, formatWait, isRipe, secondsUntil, sellable, seedCount, slotsToHarvest, slotsToWater } from '@/lib/farm/rules'

export default function FarmPage() {
  const { token } = useAuth()
  const [view, setView] = useState<FarmView | null>(null)
  const [progress, setProgress] = useState<FarmProgress | null>(null)
  const [tab, setTab] = useState<'garden' | 'orders' | 'quests' | 'neighbors' | 'market'>('garden')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [pick, setPick] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [kind, setKind] = useState<SceneKind>('mobile')
  const [busy, setBusy] = useState(false)
  const [loadedAt, setLoadedAt] = useState(0)
  const [now, setNow] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setKind(mq.matches ? 'desktop' : 'mobile')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function act(run: () => Promise<{ error?: string; data?: unknown }>, ok: string, _as?: string) {
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
  const plot = selected === null ? undefined : view.plots.find(p => p.slot === selected)

  async function plant(crop: FarmCrop) {
    if (pick === null || !token) return
    const slot = pick
    setPick(null)
    await act(() => plantCrop(token, slot, crop.cropKey), `Đã gieo ${crop.name}`, 'water')
  }

  /** A tap on a tile does the obvious thing: sow an empty one, water a thirsty one, harvest a ripe one; otherwise it just selects it. */
  function tapTile(slot: number) {
    if (!token || !view) return
    const p = view.plots.find(x => x.slot === slot)
    if (!p) return
    setSelected(slot)
    if (p.phase === 'empty') setPick(slot)
    else if (p.phase === 'thirsty') act(() => waterPlots(token, [slot]), 'Đã tưới', 'water')
    else if (isRipe(p)) act(() => harvestPlots(token, [slot]), `Thu hoạch ${p.yield} quả`, 'harvest')
  }

  function plotLabel(p: FarmPlot) {
    if (p.phase === 'empty') return 'Trống'
    if (p.phase === 'ripe') return 'Chín rồi!'
    if (p.phase === 'wilting') return 'Sắp héo'
    if (p.phase === 'thirsty') return 'Khát nước'
    return `còn ${formatWait((p.secondsToRipe ?? 0) - elapsed / 1000)}`
  }

  const tod = timeOfDay(new Date(now).getHours())
  const waiting = progress.orders.length > 0

  return (
    <div className="min-h-screen bg-[#e8f6d4] pb-28 lg:pb-12">
      <div className="mx-auto max-w-[1100px] lg:px-4 lg:pt-6">
        <div className="px-3 pt-3 lg:px-0 lg:pt-0">
          <Link href="/fun" className="inline-flex min-h-11 items-center gap-1 rounded-full bg-white/80 px-3 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-line">
            <img src={farmImg('leo_farmer_idle')} alt="" className="size-12 shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-lg font-black lg:text-xl">Nông trại anyLEARN</h1>
              <p className="m-0 text-xs text-muted">Cấp vườn <b>{view.level}</b> · {view.xpForNext > 0 ? `${view.xpIntoLevel}/${view.xpForNext} XP` : 'cấp tối đa'}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-lg font-black text-[#b45309]" title={view.coinName}><CoinIcon className="size-6" /> {view.balance}</span>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-0.5 rounded-xl bg-white p-1 ring-1 ring-line" role="tablist">
            {([['garden', 'Vườn'], ['orders', 'Đơn hàng'], ['quests', 'Nhiệm vụ'], ['neighbors', 'Hàng xóm'], ['market', 'Chợ']] as const).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`relative min-h-10 cursor-pointer rounded-lg border-0 px-0 text-[11px] font-extrabold ${tab === k ? 'bg-green-soft text-green-dark' : 'bg-transparent text-muted'}`}>{l}{((k === 'orders' && waiting) || (k === 'market' && progress.compost.active?.ready)) && <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" aria-hidden />}</button>
            ))}
          </div>
          {note && <p className="mt-2 rounded-xl bg-green-soft px-3 py-2 text-sm font-bold text-green-dark" role="status">{note}</p>}
        </div>

        {tab === 'garden' && (
          <>
            <div className="mt-2">
              <FarmScene view={view} kind={kind} tod={tod} elapsed={elapsed} selected={selected} onTile={tapTile} onExpand={() => act(() => expandPlots(token), 'Đã mở thêm ô đất')} />
            </div>
            <div className="mx-auto mt-2 max-w-[720px] px-3 lg:px-0">
              {plot && plot.phase !== 'empty' && (
                <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2.5 ring-1 ring-line">
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm">{cropOf(plot.cropKey)?.name ?? 'Cây trồng'}</b>
                    <span className="text-xs text-muted">{plotLabel(plot)}{plot.phase === 'growing' && plot.waterNeeds && (plot.watersDone ?? 0) < plot.waterNeeds && plot.nextWaterAt ? ` · tưới sau ${formatWait(secondsUntil(plot.nextWaterAt, view.serverNow, elapsed))}` : ''}</span>
                  </div>
                  {(plot.phase === 'growing' || plot.phase === 'thirsty') && !plot.fertilized && (view.inventory.fertilizer ?? 0) > 0 && (
                    <button type="button" className="min-h-10 cursor-pointer rounded-lg border-0 bg-white px-3 text-xs font-extrabold text-ink ring-1 ring-line" disabled={busy} onClick={() => act(() => fertilizePlot(token, plot.slot), 'Đã bón phân, +1 quả')}>Bón phân ({view.inventory.fertilizer})</button>
                  )}
                  {plot.phase === 'thirsty' && <button type="button" className="btn btn--green min-h-10" disabled={busy} onClick={() => act(() => waterPlots(token, [plot.slot]), 'Đã tưới', 'water')}>Tưới</button>}
                  {isRipe(plot) && <button type="button" className="btn btn--green min-h-10" disabled={busy} onClick={() => act(() => harvestPlots(token, [plot.slot]), `Thu hoạch ${plot.yield} quả`, 'harvest')}>Thu {plot.yield} quả</button>}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="btn btn--green min-h-11 px-1 text-xs" disabled={busy || toWater.length === 0} onClick={() => act(() => waterPlots(token, toWater), `Đã tưới ${toWater.length} ô`, 'water')}>Tưới tất cả ({toWater.length})</button>
                <button type="button" className="btn btn--green min-h-11 px-1 text-xs" disabled={busy || toHarvest.length === 0} onClick={() => act(() => harvestPlots(token, toHarvest), `Đã thu ${toHarvest.length} ô`, 'harvest')}>Thu tất cả ({toHarvest.length})</button>
                <button type="button" className="min-h-11 cursor-pointer rounded-xl border-0 bg-white px-1 text-xs font-extrabold text-ink ring-1 ring-line" disabled={busy} onClick={() => act(() => buyFertilizer(token, 1), 'Đã mua 1 phân bón', 'cheer')}>Mua phân · {view.fertilizerPrice}</button>
              </div>
            </div>
          </>
        )}
        <div className="mx-auto max-w-[720px] px-3 lg:px-0">
          {tab === 'orders' && <OrdersTab token={token} view={view} progress={progress} busy={busy} run={act} setNote={setNote} />}
          {tab === 'quests' && <QuestsTab token={token} view={view} progress={progress} busy={busy} run={act} setNote={setNote} />}
          {tab === 'neighbors' && <NeighborsTab token={token} view={view} onChanged={load} />}
        </div>
      </div>

      {tab === 'market' && (
        <div className="mx-auto mt-3 max-w-[1100px] space-y-3 px-3 lg:px-4">
        <div className="mx-auto max-w-[720px] space-y-3">
        <section className="rounded-2xl bg-white p-4 ring-1 ring-line" aria-label="Thùng ủ phân">
        <h2 className="m-0 flex items-center gap-2 text-lg font-black"><img src={farmImg('compost_bin')} alt="" className="h-10 w-14 object-contain" />Thùng ủ phân</h2>
      <div>
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
    </div>
        </section>
        <section className="rounded-2xl bg-white p-4 ring-1 ring-line" aria-label="Chợ">
        <h2 className="m-0 flex items-center gap-2 text-lg font-black"><img src={farmImg('market_stall')} alt="" className="h-10 w-14 object-contain" />Chợ</h2>
      <div>
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
    </div>
        </section>
        </div>
        </div>
      )}

      {pick !== null && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:items-center lg:justify-center" role="dialog" aria-modal="true" aria-label="Chọn hạt">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 lg:max-w-md lg:rounded-3xl">
            <div className="flex items-center justify-between"><h2 className="m-0 flex items-center gap-2 text-lg font-black"><img src={farmImg('item_seed_packet')} alt="" className="size-8 object-contain" />Chọn hạt giống</h2><button type="button" className="min-h-11 cursor-pointer border-0 bg-transparent text-sm font-bold" onClick={() => setPick(null)}>Đóng</button></div>
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
