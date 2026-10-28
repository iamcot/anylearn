'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import BrandText from '../BrandText'
import CoinIcon from '../CoinIcon'
import ShopEntryCard from '../shop/ShopEntryCard'
import { buyShopEntry, type Shop, type ShopEntry } from '@/lib/api/shop'
import type { QuizMe } from '@/lib/api/quiz'
import { DURING_ITEMS, ITEM_HINT } from '@/lib/quiz/rules'
import { packTitle, remainingText, tickEnergy } from '@/lib/shop/rules'
import { useToast } from '@/components/ToastProvider'
import EnergyBar from './EnergyBar'
import ItemIcon from './ItemIcon'
import ItemShop from './ItemShop'
import PacksSection from './PacksSection'
import PrepRow, { type Prep } from './PrepRow'
import RankCard from './RankCard'
import LeoSays from './LeoSays'
import { quizLobbyContext } from '@/lib/fun/leo'

/**
 * The lobby, top to bottom: rank, daily box, items to bring into the next question, the energy bar, the ready button
 * (or "Tập luyện" while a training pack is in use), items used inside a question, my training packs and the shop of Leo rank.
 */
export default function LobbyView({ token, me, shop, fetchedAt, prep, onMult, onShield, onTopic, onStart, onOpenBox, onLeavePractice, onMe, onChanged, busy, boxText }: {
  token: string
  me: QuizMe
  shop: Shop | null
  /** When `me` was read, so the energy countdown keeps moving on the screen. */
  fetchedAt: number
  prep: Prep
  onMult: (item: Parameters<React.ComponentProps<typeof PrepRow>['onMult']>[0]) => void
  onShield: () => void
  onTopic: (topic: string | null) => void
  onStart: () => void
  onOpenBox: () => void
  onLeavePractice: () => void
  onMe: (next: QuizMe) => void
  onChanged: () => void
  busy: boolean
  boxText: string
}) {
  const toast = useToast()
  const [now, setNow] = useState(() => Date.now())
  const [refill, setRefill] = useState(false)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const energy = me.energy
  const ticked = tickEnergy(energy, (now - fetchedAt) / 1000)
  const practicePack = me.activePackId === null ? null : me.packs.find(p => p.id === me.activePackId) ?? null
  const outOfEnergy = !practicePack && ticked.value < energy.cost
  const refillEntry = shop?.items.find(e => e.kind === 'energy' && e.enabled) ?? null

  const buyEnergy = async (entry: ShopEntry, difficulty: number | null): Promise<string | null> => {
    const { data, error } = await buyShopEntry(token, entry.key, difficulty)
    if (error || !data) return error ?? 'Không nạp được'
    toast({ kind: 'success', text: data.message })
    setRefill(false)
    onChanged()
    return null
  }

  return (
    <div className="grid gap-4">
      <LeoSays ctx={quizLobbyContext(me, new Date().getDate())} />
      <RankCard profile={me.profile} />
      <Link href="/fun/quiz/board" className="flex min-h-12 items-center justify-between rounded-2xl bg-white px-4 text-sm font-extrabold text-ink no-underline ring-1 ring-line">Bảng xếp hạng tuần, tháng và theo hạng <span aria-hidden className="text-muted">›</span></Link>

      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-line">
        <span className="font-bold">Hôm nay: {me.today.correct} đúng / {me.today.games} câu</span>
        <span className="inline-flex items-center gap-1 font-black text-[#b45309]" title={me.coinName}><CoinIcon className="size-5" /> {me.coins}</span>
      </div>

      {me.boxReady && (
        <button type="button" disabled={busy} onClick={onOpenBox}
          className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-green bg-green-soft px-4 text-left disabled:opacity-60">
          <span className="grid size-11 place-items-center rounded-xl bg-white text-2xl" aria-hidden>🎁</span>
          <span><span className="block font-black text-green-dark">Mở hộp quà khởi động hôm nay</span><span className="block text-xs text-muted">Luôn có 1 vật phẩm trước câu và 1 vật phẩm trong câu</span></span>
        </button>
      )}
      {boxText && <p className="m-0 rounded-xl bg-green-soft p-3 text-sm font-bold text-green-dark" role="status"><BrandText text={boxText} coinName={me.coinName} /></p>}

      {practicePack
        ? (
          <p className="m-0 rounded-2xl bg-sky-50 p-3 text-sm text-sky-900" role="status">
            <b>Đang tập luyện: {packTitle(practicePack)}</b> · {remainingText(practicePack)}. Không tốn năng lượng, không tính sao, không dùng được vật phẩm; sau mỗi câu bạn thấy đáp án đúng.
          </p>
        )
        : (
          <section>
            <h2 className="m-0 mb-2 text-sm font-extrabold">Chuẩn bị trước câu hỏi</h2>
            <PrepRow me={me} items={me.items} prep={prep} onMult={onMult} onShield={onShield} onTopic={onTopic} />
          </section>
        )}

      <div className="grid gap-2">
        <EnergyBar value={ticked.value} max={energy.max} nextInSeconds={ticked.nextInSeconds} canRefill={refillEntry !== null} refillOpen={refill} onRefill={() => setRefill(r => !r)} />
        {refill && refillEntry && shop && (
          <ul className="m-0 grid list-none gap-2 p-0">
            <ShopEntryCard entry={refillEntry} coins={shop.coins} coinName={shop.coinName} levelLabels={shop.levelLabels} showGame={false} showLink={false} onBuy={buyEnergy} />
          </ul>
        )}
        <button type="button" disabled={busy || outOfEnergy} onClick={onStart}
          className={`min-h-14 w-full cursor-pointer rounded-full border-0 px-5 text-lg font-black text-white active:translate-y-0.5 active:shadow-none disabled:opacity-60 ${practicePack ? 'bg-navy shadow-[0_4px_0_#000]' : 'bg-green shadow-[0_4px_0_#008244]'}`}>
          {practicePack ? 'Tập luyện' : outOfEnergy ? 'Hết năng lượng' : 'Sẵn sàng'}
        </button>
        {practicePack && (
          <button type="button" disabled={busy} onClick={onLeavePractice} className="min-h-10 cursor-pointer border-0 bg-transparent text-sm font-bold text-muted underline disabled:opacity-60">× Thoát tập luyện</button>
        )}
      </div>
      <p className="m-0 text-center text-xs text-muted">Có {me.seconds} giây để trả lời. Đáp án được chấm trên máy chủ, thoát giữa chừng tính là sai.</p>

      <section className="rounded-2xl border border-line bg-white p-4">
        <h2 className="m-0 text-sm font-extrabold">Vật phẩm dùng trong câu hỏi</h2>
        <ul className="m-0 mt-2 grid list-none grid-cols-2 gap-2 p-0">
          {DURING_ITEMS.map(key => (
            <li key={key} className="flex items-center gap-2 text-sm" title={ITEM_HINT[key]}>
              <ItemIcon item={key} className="size-7" />
              <span className="flex-1 leading-tight">{me.itemList.find(r => r.key === key)?.label}</span>
              <b>{me.items[key] ?? 0}</b>
            </li>
          ))}
        </ul>
      </section>

      <PacksSection token={token} me={me} onSaved={onMe} />

      {shop && <ItemShop token={token} shop={shop} buyLeft={me.buyLeft} onBought={onChanged} />}
    </div>
  )
}
