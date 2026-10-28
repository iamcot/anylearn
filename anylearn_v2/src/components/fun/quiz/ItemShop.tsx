'use client'

import Link from 'next/link'
import BrandText from '../BrandText'
import CoinIcon from '../CoinIcon'
import ShopEntryCard from '../shop/ShopEntryCard'
import { buyShopEntry, type Shop, type ShopEntry } from '@/lib/api/shop'
import { lobbyEntries } from '@/lib/shop/rules'
import { useToast } from '@/components/ToastProvider'

/** The shop inside Leo rank: quiz items and training packs only (same catalog as `/fun/shop`, so a price is edited in one place). */
export default function ItemShop({ token, shop, buyLeft, onBought }: { token: string; shop: Shop; buyLeft: number; onBought: () => void }) {
  const toast = useToast()
  const entries = lobbyEntries(shop.items)
  const items = entries.filter(e => e.kind === 'item')
  const packs = entries.filter(e => e.kind === 'pack')

  const buy = async (entry: ShopEntry, difficulty: number | null): Promise<string | null> => {
    const { data, error } = await buyShopEntry(token, entry.key, difficulty)
    if (error || !data) return error ?? 'Không mua được'
    toast({ kind: 'success', text: data.message })
    onBought()
    return null
  }

  const list = (rows: ShopEntry[]) => (
    <ul className="m-0 mt-2 grid list-none gap-2 p-0">
      {rows.map(entry => (
        <ShopEntryCard key={entry.key} entry={entry} coins={shop.coins} coinName={shop.coinName} levelLabels={shop.levelLabels} showGame={false} showLink={false} onBuy={buy} />
      ))}
    </ul>
  )

  return (
    <section className="rounded-2xl border border-line bg-white p-4" aria-label="Cửa hàng vật phẩm">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-base font-extrabold">Cửa hàng</h2>
        <span className="inline-flex items-center gap-1 text-sm font-black text-[#b45309]"><CoinIcon className="size-5" /> {shop.coins}</span>
      </div>
      <p className="m-0 mt-1 text-xs text-muted">Mua bằng <BrandText text={shop.coinName} coinName={shop.coinName} />, còn {buyLeft} lượt mua vật phẩm hôm nay.</p>
      {packs.length > 0 && <h3 className="m-0 mt-4 text-sm font-extrabold">Gói tập luyện</h3>}
      {packs.length > 0 && list(packs)}
      {list(items)}
      <Link href="/fun/shop" className="mt-3 block text-center text-sm font-bold text-green-dark no-underline">Xem cả cửa hàng <BrandText text={shop.coinName} coinName={shop.coinName} /> ›</Link>
    </section>
  )
}
