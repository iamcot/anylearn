'use client'

import { useCallback, useEffect, useState } from 'react'
import BrandText from './BrandText'
import CoinIcon from './CoinIcon'
import StickerArt from './sticker/StickerArt'
import { claimMission, getMissions, type MissionsView } from '@/lib/api/fun'
import type { StickerView } from '@/lib/api/stickers'
import { bonusState, bonusText, countdownText, missionState, percent } from '@/lib/fun/missions'

/** "Nhiệm vụ tuần" on /fun: progress bars, a claim button per mission, the free sticker for enough missions and the countdown to Monday. */
export default function MissionsCard({ token, refreshKey, onClaimed }: { token: string; refreshKey: number; onClaimed?: () => void }) {
  const [view, setView] = useState<MissionsView | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [sticker, setSticker] = useState<StickerView | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const load = useCallback(() => getMissions(token).then(({ data }) => { if (data) setView(data) }), [token])

  useEffect(() => {
    let cancelled = false
    getMissions(token).then(({ data }) => { if (!cancelled && data) setView(data) })
    return () => { cancelled = true }
  }, [token, refreshKey])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!view || view.missions.length === 0) return null
  const coinName = view.coinName
  const bonus = bonusState(view.bonus)

  const claim = async (key: string) => {
    if (busy) return
    setBusy(key)
    setNotice('')
    const { data, error } = await claimMission(token, key)
    setBusy(null)
    if (error || !data) { setNotice(error ?? 'Chưa nhận được thưởng, thử lại sau nhé!'); return }
    if (data.sticker) { setSticker(data.sticker); setNotice(`Bạn nhận được sticker ${data.sticker.name}!`) }
    else if (data.coins > 0) setNotice(`Bạn nhận được ${data.coins} ${coinName}!`)
    await load()
    onClaimed?.()
  }

  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-4" aria-label="Nhiệm vụ tuần">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-base font-extrabold">Nhiệm vụ tuần</h2>
        <span className="text-xs text-muted">Làm mới sau {countdownText(view.endsAt, now)}</span>
      </div>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0">
        {view.missions.map(m => {
          const state = missionState(m)
          return (
            <li key={m.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-bold">{m.label}</span>
                  <span className="shrink-0 text-xs font-bold text-muted">{m.progress}/{m.target}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={m.target} aria-valuenow={m.progress}>
                  <div className={`h-full rounded-full ${state === 'todo' ? 'bg-green' : 'bg-[#fb923c]'}`} style={{ width: `${percent(m)}%` }} />
                </div>
              </div>
              {state === 'claimed' ? (
                <span className="min-w-[88px] text-center text-xs font-bold text-muted">Đã nhận</span>
              ) : (
                <button type="button" disabled={state !== 'ready' || busy !== null} onClick={() => claim(m.key)}
                  className={`inline-flex min-h-10 min-w-[88px] cursor-pointer items-center justify-center gap-1 rounded-full border-0 px-3 text-sm font-black disabled:cursor-default ${state === 'ready' ? 'bg-green text-white shadow-[0_3px_0_#008244]' : 'bg-slate-100 text-muted'}`}>
                  {state === 'ready' ? 'Nhận' : ''} <CoinIcon className="size-4" /> {m.reward}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className={`mt-4 flex items-center gap-3 rounded-xl p-3 ${bonus === 'ready' ? 'bg-green-soft' : 'bg-slate-50'}`}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-2xl" aria-hidden>{bonus === 'claimed' ? '✅' : '🎁'}</span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold">Sticker thưởng của tuần ({view.bonus.done}/{view.bonus.needed} nhiệm vụ)</div>
          <div className="text-xs text-muted">{bonusText(view.bonus)}</div>
        </div>
        {bonus === 'ready' && (
          <button type="button" disabled={busy !== null} onClick={() => claim('bonus')}
            className="min-h-10 shrink-0 cursor-pointer rounded-full border-0 bg-green px-4 text-sm font-black text-white shadow-[0_3px_0_#008244] disabled:opacity-60">Nhận</button>
        )}
      </div>

      {notice && (
        <p className="m-0 mt-3 flex items-center gap-2 rounded-xl bg-green-soft p-3 text-sm font-bold text-green-dark" role="status">
          {sticker && <span className="size-8 shrink-0"><StickerArt sticker={sticker} className="size-full text-xl" /></span>}
          <BrandText text={notice} coinName={coinName} />
        </p>
      )}
    </section>
  )
}
