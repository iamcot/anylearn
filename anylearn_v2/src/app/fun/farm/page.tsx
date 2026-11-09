/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import BrandText from '@/components/fun/BrandText'
import {
  buyFertilizer, collectCompost, expandPlots, fertilizePlot, getFarm, getProgress, harvestPlots, plantCrop, sellCrops, startCompost, waterPlots,
  type FarmCrop, type FarmPlot, type FarmProgress, type FarmView,
} from '@/lib/api/farm'
import OrdersTab from '@/components/fun/farm/OrdersTab'
import QuestsTab from '@/components/fun/farm/QuestsTab'
import NeighborsTab from '@/components/fun/farm/NeighborsTab'
import FarmScene from '@/components/fun/farm/FarmScene'
import { farmImg, timeOfDay } from '@/lib/farm/art'
import type { SceneKind, Size } from '@/lib/farm/scene'
import { capUsedPercent, formatWait, isRipe, sellable, seedCount, slotsToHarvest, slotsToWater } from '@/lib/farm/rules'

function ActionButton({ icon, label, count, disabled, onClick }: { icon: string; label: string; count: number; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="flex min-h-12 cursor-pointer flex-col items-center gap-0.5 border-0 bg-transparent p-1 text-center transition-transform active:scale-95 disabled:cursor-default disabled:opacity-45 lg:flex-row lg:gap-2">
      <span className="relative">
        <img src={farmImg(icon)} alt="" className="size-12 object-contain drop-shadow lg:size-12" draggable={false} />
        {count > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-green px-1 text-center text-[11px] font-black leading-5 text-white ring-2 ring-white">{count}</span>}
      </span>
      <span className="max-w-24 text-xs font-extrabold leading-tight text-white lg:max-w-none lg:text-sm [text-shadow:-1px_-1px_0_#4a2a10,1px_-1px_0_#4a2a10,-1px_1px_0_#4a2a10,1px_1px_0_#4a2a10,0_2px_3px_rgba(0,0,0,.4)]">{label}</span>
    </button>
  )
}

export default function FarmPage() {
  const { token } = useAuth()
  const [view, setView] = useState<FarmView | null>(null)
  const [progress, setProgress] = useState<FarmProgress | null>(null)
  const [panel, setPanel] = useState<'orders' | 'quests' | 'neighbors' | 'market' | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<Size | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [pick, setPick] = useState<number | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmExpand, setConfirmExpand] = useState(false)
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

  // the game fills the screen: measure it, and keep the page itself from scrolling behind it
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { ro.disconnect(); document.body.style.overflow = prev }
  }, [view])

  // a message on the garden disappears by itself
  useEffect(() => {
    if (!note) return
    const id = setTimeout(() => setNote(''), 3200)
    return () => clearTimeout(id)
  }, [note])

  const load = useCallback(async () => {
    if (!token) return
    // one after the other: a new player's first two calls would both create the profile row
    const { data, error: err } = await getFarm(token)
    const { data: prog } = await getProgress(token)
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
  if (error) return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#e8f6d4] px-4"><p className="text-warn-text" role="alert">{error}</p></div>
  if (!view || !progress) return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#e8f6d4]"><div className="size-16 animate-pulse rounded-full bg-green/40" /></div>

  const cropOf = (k?: string) => view.crops.find(c => c.cropKey === k)
  const toWater = slotsToWater(view.plots)
  const toHarvest = slotsToHarvest(view.plots)
  const sell = sellable(view)
  const used = capUsedPercent(view.market.room, view.market.dayCap)

  async function plant(crop: FarmCrop) {
    if (pick === null || !token) return
    const slot = pick
    setPick(null)
    await act(() => plantCrop(token, slot, crop.cropKey), `Đã gieo ${crop.name}`, 'water')
  }

  /** A tap on a tile does the obvious thing: sow an empty one, water a thirsty one, harvest a ripe one, feed a growing one; otherwise it says what is left. */
  function tapTile(slot: number) {
    if (!token || !view) return
    const p = view.plots.find(x => x.slot === slot)
    if (!p) return
    setSelected(slot)
    if (p.phase === 'empty') setPick(slot)
    else if (p.phase === 'thirsty') act(() => waterPlots(token, [slot]), 'Đã tưới', 'water')
    else if (isRipe(p)) act(() => harvestPlots(token, [slot]), `Thu hoạch ${p.yield} quả`, 'harvest')
    else if (p.phase === 'growing' && !p.fertilized && (view.inventory.fertilizer ?? 0) > 0) act(() => fertilizePlot(token, slot), 'Đã bón phân, +1 quả')
    else setNote(`${cropOf(p.cropKey)?.name ?? 'Cây'}: ${plotLabel(p)}`)
  }

  function tapCompost() {
    if (!token || !progress) return
    if (progress.compost.active?.ready) act(() => collectCompost(token), 'Đã nhận phân bón')
    else setPanel('market')
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
  const tabs = [['garden', 'Vườn', 'ui_tab_garden'], ['orders', 'Đơn hàng', 'ui_tab_orders'], ['quests', 'Nhiệm vụ', 'ui_tab_quests'], ['neighbors', 'Hàng xóm', 'ui_tab_neighbors'], ['market', 'Chợ', 'ui_tab_market_alt']] as const
  const active = panel ?? 'garden'

  return (
    <div ref={rootRef} className="fixed inset-0 z-[90] overflow-hidden bg-[#9be15d]">
      {size && <FarmScene view={view} progress={progress} size={size} kind={kind} tod={tod} elapsed={elapsed} selected={selected} onTile={tapTile} onExpand={() => setConfirmExpand(true)} onCompost={tapCompost} />}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[700] flex items-start justify-between p-2">
        <div className="pointer-events-auto flex items-start gap-1">
          <Link href="/fun" aria-label="Về Vui học" className="grid size-10 place-items-center rounded-full bg-white/80 text-text no-underline shadow"><ChevronLeftIcon className="size-5" /></Link>
          <div className="relative w-[150px] lg:w-[190px]">
            <img src={farmImg('ui_sign_board')} alt="" className="block h-auto w-full" draggable={false} />
            <div className="absolute inset-x-[9%] bottom-[16%] top-[32%] flex flex-col items-center justify-center text-center">
              <h1 className="m-0 text-[11px] font-black leading-tight text-white [-webkit-text-stroke:3px_#4a2a10] [paint-order:stroke_fill] lg:text-sm">Nông trại anyLEARN</h1>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="rounded-full bg-[#fff4d6] px-1.5 text-[10px] font-black leading-4 text-[#5b3a1a]">Cấp {view.level}</span>
                {view.xpForNext > 0 && (
                  <span className="h-1.5 w-10 overflow-hidden rounded-full bg-[#5b3a1a]/60 lg:w-16" role="progressbar" aria-valuenow={view.xpIntoLevel} aria-valuemin={0} aria-valuemax={view.xpForNext} title={`${view.xpIntoLevel}/${view.xpForNext} XP`}>
                    <span className="block h-full bg-[#ffd54a]" style={{ width: `${Math.min(100, (view.xpIntoLevel / view.xpForNext) * 100)}%` }} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5" title={view.coinName}>
          <span className="text-lg font-black leading-none text-white lg:text-xl [text-shadow:-1px_-1px_0_#4a2a10,1px_-1px_0_#4a2a10,-1px_1px_0_#4a2a10,1px_1px_0_#4a2a10,0_2px_3px_rgba(0,0,0,.4)]">{view.balance}</span>
          <img src={farmImg('ui_coin_chest')} alt="" className="size-10 object-contain lg:size-12" draggable={false} />
        </div>
      </div>

      {note && <p className="pointer-events-none absolute left-1/2 top-16 z-[900] m-0 max-w-[80%] -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-center text-sm font-extrabold text-green-dark shadow-lg lg:top-20" role="status">{note}</p>}

      <div className="absolute right-1 top-1/2 z-[800] flex -translate-y-1/2 flex-col gap-1" role="tablist">
        {tabs.map(([k, l, ic]) => (
          <button key={k} type="button" role="tab" aria-selected={active === k} aria-label={l} title={l} onClick={() => setPanel(k === 'garden' || panel === k ? null : k)} className={`relative flex w-16 cursor-pointer flex-col items-center gap-0 rounded-xl border-0 px-0 py-1 ${active === k ? 'bg-white/45 shadow-[0_0_10px_rgba(255,255,255,.9)]' : 'bg-transparent'}`}>
            <img src={farmImg(ic)} alt="" className="h-9 w-11 object-contain drop-shadow" draggable={false} />
            <span className="text-[10px] font-extrabold leading-tight text-white [text-shadow:-1px_-1px_0_#4a2a10,1px_-1px_0_#4a2a10,-1px_1px_0_#4a2a10,1px_1px_0_#4a2a10,0_2px_3px_rgba(0,0,0,.4)]">{l}</span>
            {((k === 'orders' && waiting) || (k === 'market' && progress.compost.active?.ready)) && <span className="absolute right-1.5 top-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[700] flex items-end justify-center gap-3 pr-16 lg:gap-8">
        <div className="pointer-events-auto"><ActionButton icon="tool_can_1" label="Tưới tất cả" count={toWater.length} disabled={busy || toWater.length === 0} onClick={() => act(() => waterPlots(token, toWater), `Đã tưới ${toWater.length} ô`, 'water')} /></div>
        <div className="pointer-events-auto"><ActionButton icon="item_basket" label="Thu tất cả" count={toHarvest.length} disabled={busy || toHarvest.length === 0} onClick={() => act(() => harvestPlots(token, toHarvest), `Đã thu ${toHarvest.length} ô`, 'harvest')} /></div>
        <div className="pointer-events-auto"><ActionButton icon="item_fertilizer" label={`Mua phân · ${view.fertilizerPrice}`} count={view.inventory.fertilizer ?? 0} disabled={busy} onClick={() => act(() => buyFertilizer(token, 1), 'Đã mua 1 phân bón', 'cheer')} /></div>
      </div>

      {panel && (
        <div className="absolute inset-y-14 left-2 right-[72px] z-[750] mx-auto max-w-[680px] overflow-y-auto rounded-2xl bg-white/95 p-3 shadow-2xl lg:inset-y-20" role="region" aria-label="Bảng">
          <button type="button" className="sticky top-0 float-right grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-slate-100 text-lg font-black" aria-label="Đóng" onClick={() => setPanel(null)}>×</button>
          {panel === 'orders' && <OrdersTab token={token} view={view} progress={progress} busy={busy} run={act} setNote={setNote} />}
          {panel === 'quests' && <QuestsTab token={token} view={view} progress={progress} busy={busy} run={act} setNote={setNote} />}
          {panel === 'neighbors' && <NeighborsTab token={token} view={view} onChanged={load} />}
          {panel === 'market' && (
            <div className="space-y-3">
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
          )}
        </div>
      )}

      {confirmExpand && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:items-center lg:justify-center" role="dialog" aria-modal="true" aria-label="Mở thêm ô đất" onClick={() => setConfirmExpand(false)}>
          <div className="w-full rounded-t-3xl bg-white p-5 text-center lg:max-w-sm lg:rounded-3xl" onClick={e => e.stopPropagation()}>
            <img src={farmImg('plot_locked')} alt="" className="mx-auto h-24 w-36 object-contain" />
            <h2 className="m-0 mt-1 text-lg font-black">Mở thêm ô đất?</h2>
            {(() => {
              const lowLevel = view.level < view.nextPlotLevel
              const lowCoin = view.balance < view.nextPlotPrice
              if (lowLevel || lowCoin) {
                return (
                  <>
                    <p className="mt-2 flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2 text-left text-sm font-bold text-orange-700 ring-1 ring-orange-200" role="alert">
                      <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
                      <span>{lowLevel
                        ? `Ô đất này mở ở cấp ${view.nextPlotLevel}, bạn đang ở cấp ${view.level}. Chơi thêm để lên cấp nhé.`
                        : `Chưa đủ xu: cần ${view.nextPlotPrice} ${view.coinName}, bạn đang có ${view.balance}.`}</span>
                    </p>
                    <button type="button" className="mt-4 min-h-11 w-full cursor-pointer rounded-xl border-0 bg-white text-sm font-extrabold text-ink ring-1 ring-line" onClick={() => setConfirmExpand(false)}>Đã hiểu</button>
                  </>
                )
              }
              return (
                <>
                  <p className="mt-1 text-sm text-muted">Mở ô đất mới cần <b>{view.nextPlotPrice} {view.coinName}</b>. Bạn có muốn mua không?</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" className="min-h-11 cursor-pointer rounded-xl border-0 bg-white text-sm font-extrabold text-ink ring-1 ring-line" onClick={() => setConfirmExpand(false)}>Để sau</button>
                    <button type="button" className="btn btn--green min-h-11" disabled={busy} onClick={async () => { setConfirmExpand(false); await act(() => expandPlots(token), 'Đã mở thêm ô đất') }}>Mua · {view.nextPlotPrice} xu</button>
                  </div>
                </>
              )
            })()}
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
