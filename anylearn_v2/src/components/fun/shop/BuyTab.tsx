'use client'

import Link from 'next/link'
import { useState } from 'react'
import BrandText from '../BrandText'
import StickerArt from '../sticker/StickerArt'
import ShopEntryCard from './ShopEntryCard'
import { buyShopEntry, type Shop, type ShopEntry } from '@/lib/api/shop'
import type { StickerView } from '@/lib/api/stickers'
import type { ShopGame } from '@/lib/api/shop'
import { groupByGame } from '@/lib/shop/rules'
import { useToast } from '@/components/ToastProvider'

/** The "Mua" tab: every item of the catalog grouped by game; `only` narrows it to one game (the shortcut inside that game). */
export default function BuyTab({ token, shop, only, onChanged }: { token: string; shop: Shop; only: ShopGame | null; onChanged: () => void }) {
  const toast = useToast()
  const [revealed, setRevealed] = useState<StickerView | null>(null)
  const groups = groupByGame(shop.items, only)

  const buy = async (entry: ShopEntry, difficulty: number | null): Promise<string | null> => {
    const { data, error } = await buyShopEntry(token, entry.key, difficulty)
    if (error || !data) return error ?? 'Không mua được'
    setRevealed(data.sticker ?? null)
    toast({ kind: 'success', text: data.message })
    onChanged()
    return null
  }

  if (!shop.enabled) return <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Cửa hàng đang tạm nghỉ, số dư của bạn vẫn được giữ nguyên.</p>

  return (
    <div className="mt-4 grid gap-5">
      {revealed && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-green bg-white p-3" role="status">
          <span className="size-16 shrink-0"><StickerArt sticker={revealed} className="size-full text-3xl" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-muted">Rương vừa mở ra</div>
            <div className="font-black"><BrandText text={revealed.name} /></div>
            <div className="text-xs font-bold text-green-dark">{revealed.rarityLabel}</div>
          </div>
          <Link href="/fun/sticker" className="shrink-0 text-sm font-bold text-green-dark no-underline">Mở album ›</Link>
        </div>
      )}
      {groups.map(group => (
        <section key={group.game} aria-label={group.title}>
          <h2 className="m-0 mb-2 text-base font-extrabold"><BrandText text={group.title} /></h2>
          <ul className="m-0 grid list-none gap-2 p-0">
            {group.entries.map(entry => (
              <ShopEntryCard key={entry.key} entry={entry} coins={shop.coins} coinName={shop.coinName} levelLabels={shop.levelLabels}
                showGame={false} showLink onBuy={buy} />
            ))}
          </ul>
        </section>
      ))}
      {only && <Link href="/fun/shop" className="text-center text-sm font-bold text-green-dark no-underline">Xem cả cửa hàng <BrandText text={shop.coinName} coinName={shop.coinName} /> ›</Link>}
    </div>
  )
}
