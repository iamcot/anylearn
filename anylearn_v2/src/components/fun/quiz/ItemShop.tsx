'use client'

import { useState } from 'react'
import BrandText from '../BrandText'
import CoinIcon from '../CoinIcon'
import { buyQuizItem, type ItemKey, type QuizMe } from '@/lib/api/quiz'
import { ITEM_HINT } from '@/lib/quiz/rules'
import ItemIcon from './ItemIcon'

/** Buy items with the game currency; a small confirm line keeps a stray tap from spending. */
export default function ItemShop({ token, me, onBought }: { token: string; me: QuizMe; onBought: (next: { items: QuizMe['items']; coins: number; buyLeft: number }, text: string) => void }) {
  const [asking, setAsking] = useState<ItemKey | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const buy = async (key: ItemKey) => {
    setBusy(true)
    setError('')
    const { data, error: err } = await buyQuizItem(token, key)
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không mua được')
    setAsking(null)
    onBought(data, `Đã mua ${me.itemList.find(r => r.key === key)?.label}`)
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-4" aria-label="Cửa hàng vật phẩm">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-base font-extrabold">Cửa hàng</h2>
        <span className="inline-flex items-center gap-1 text-sm font-black text-[#b45309]"><CoinIcon className="size-5" /> {me.coins}</span>
      </div>
      <p className="m-0 mt-1 text-xs text-muted">Mua bằng <BrandText text={me.coinName} coinName={me.coinName} />, còn {me.buyLeft} lượt mua hôm nay.</p>
      {error && <p className="mt-2 text-sm text-warn-text" role="alert">{error}</p>}
      <ul className="m-0 mt-3 grid list-none gap-2 p-0">
        {me.itemList.map(row => {
          const full = row.qty >= row.cap
          return (
            <li key={row.key} className="rounded-xl border border-line p-2">
              <div className="flex items-center gap-3">
                <ItemIcon item={row.key} className="size-8" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{row.label} <span className="font-normal text-muted">(có {row.qty})</span></div>
                  <div className="text-xs text-muted">{ITEM_HINT[row.key]}</div>
                </div>
                <button type="button" disabled={full || me.buyLeft < 1 || busy} onClick={() => setAsking(asking === row.key ? null : row.key)}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border border-line bg-white px-3 text-sm font-black text-[#b45309] disabled:cursor-not-allowed disabled:opacity-45">
                  <CoinIcon className="size-4" /> {row.price}
                </button>
              </div>
              {asking === row.key && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-green-soft p-2 text-sm">
                  <span>Mua <b>{row.label}</b> với {row.price} <BrandText text={me.coinName} coinName={me.coinName} />?</span>
                  <span className="flex gap-2">
                    <button type="button" onClick={() => setAsking(null)} className="min-h-9 cursor-pointer rounded-full border border-line bg-white px-3 font-bold">Thôi</button>
                    <button type="button" disabled={busy} onClick={() => buy(row.key)} className="min-h-9 cursor-pointer rounded-full border-0 bg-green px-3 font-black text-white">Mua</button>
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
