'use client'

import { useState } from 'react'
import BrandText from '../BrandText'
import CoinIcon from '../CoinIcon'
import ItemIcon from '../quiz/ItemIcon'
import StickerArt from '../sticker/StickerArt'
import { sellToLeo, type Shop } from '@/lib/api/shop'
import type { ItemKey } from '@/lib/api/quiz'
import { useToast } from '@/components/ToastProvider'

interface Pending { kind: 'sticker' | 'item'; id: string; name: string; price: number }

/** The "Bán" tab: duplicate stickers and spare quiz items Leo buys for Leo Xu. The first copy of a sticker is never offered. */
export default function SellTab({ token, shop, onChanged }: { token: string; shop: Shop; onChanged: () => void }) {
  const toast = useToast()
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { sell, coinName } = shop

  const confirm = async () => {
    if (!pending) return
    setBusy(true)
    setError('')
    const { data, error: err } = await sellToLeo(token, pending.kind, pending.id)
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không bán được')
    setPending(null)
    toast({ kind: 'success', text: data.message })
    onChanged()
  }

  const ask = (next: Pending) => { setError(''); setPending(pending?.kind === next.kind && pending.id === next.id ? null : next) }
  const asking = (kind: Pending['kind'], id: string) => pending?.kind === kind && pending.id === id

  const confirmLine = (
    <div className="mt-2 grid gap-2 rounded-lg bg-green-soft p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span>Bán <b>{pending?.name}</b> cho Leo, nhận {pending?.price} <BrandText text={coinName} coinName={coinName} />?</span>
        <span className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setPending(null)} className="min-h-9 cursor-pointer rounded-full border border-line bg-white px-3 font-bold">Thôi</button>
          <button type="button" disabled={busy} onClick={confirm} className="min-h-9 cursor-pointer rounded-full border-0 bg-green px-3 font-black text-white disabled:opacity-50">Bán</button>
        </span>
      </div>
      {error && <p className="m-0 text-xs font-bold text-warn-text" role="alert">{error}</p>}
    </div>
  )

  return (
    <div className="mt-4 grid gap-5">
      <section aria-label="Sticker trùng">
        <h2 className="m-0 text-base font-extrabold">Sticker trùng</h2>
        <p className="m-0 mt-1 text-xs text-muted">
          Leo chỉ mua bản trùng, bạn luôn giữ lại 1 bản. {sell.stickerEnabled ? `Còn ${sell.stickerLeft}/${sell.stickerCap} lượt bán hôm nay.` : 'Leo đang tạm không mua sticker.'}
        </p>
        {sell.stickers.length === 0
          ? <p className="mt-3 rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Bạn chưa có sticker trùng nào để bán.</p>
          : (
            <ul className="m-0 mt-3 grid list-none gap-2 p-0">
              {sell.stickers.map(s => (
                <li key={s.id} className="rounded-xl border border-line bg-white p-2">
                  <div className="flex items-center gap-3">
                    <span className="size-12 shrink-0"><StickerArt sticker={s} className="size-full text-2xl" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold"><BrandText text={s.name} /></div>
                      <div className="text-xs text-muted">{s.rarityLabel} · bán được {s.sellable} bản</div>
                    </div>
                    <button type="button" disabled={!sell.stickerEnabled || sell.stickerLeft < 1 || busy} onClick={() => ask({ kind: 'sticker', id: String(s.id), name: s.name, price: s.price })}
                      className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border border-line bg-white px-3 text-sm font-black text-[#b45309] disabled:cursor-not-allowed disabled:opacity-45">
                      Bán <CoinIcon className="size-4" /> {s.price}
                    </button>
                  </div>
                  {asking('sticker', String(s.id)) && confirmLine}
                </li>
              ))}
            </ul>
          )}
      </section>

      <section aria-label="Vật phẩm Leo rank">
        <h2 className="m-0 text-base font-extrabold"><BrandText text="Vật phẩm Leo rank" /></h2>
        <p className="m-0 mt-1 text-xs text-muted">
          Leo trả một phần giá mua. {sell.itemEnabled ? `Còn ${sell.itemLeft}/${sell.itemCap} lượt bán hôm nay.` : 'Leo đang tạm không mua vật phẩm.'}
        </p>
        {sell.items.length === 0
          ? <p className="mt-3 rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Bạn chưa có vật phẩm nào.</p>
          : (
            <ul className="m-0 mt-3 grid list-none gap-2 p-0">
              {sell.items.map(item => (
                <li key={item.key} className="rounded-xl border border-line bg-white p-2">
                  <div className="flex items-center gap-3">
                    <ItemIcon item={item.key as ItemKey} className="size-8" />
                    <div className="min-w-0 flex-1 text-sm font-bold">{item.label} <span className="font-normal text-muted">(có {item.qty})</span></div>
                    <button type="button" disabled={!sell.itemEnabled || sell.itemLeft < 1 || busy} onClick={() => ask({ kind: 'item', id: item.key, name: item.label, price: item.price })}
                      className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border border-line bg-white px-3 text-sm font-black text-[#b45309] disabled:cursor-not-allowed disabled:opacity-45">
                      Bán <CoinIcon className="size-4" /> {item.price}
                    </button>
                  </div>
                  {asking('item', item.key) && confirmLine}
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  )
}
