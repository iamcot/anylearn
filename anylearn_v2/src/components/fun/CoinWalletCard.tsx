'use client'

import BrandText from './BrandText'
import { useEffect, useState } from 'react'
import CoinIcon from './CoinIcon'
import { getCoins, type CoinWallet } from '@/lib/api/fun'

const SOURCE_LABEL: Record<string, string> = { checkin: 'Quà điểm danh', sticker_set: 'Thưởng đủ bộ sticker', admin: 'Điều chỉnh', quiz_rank: 'Thưởng lên hạng Leo rank', quiz_item: 'Mua vật phẩm Leo rank' }

/** The balance of the game currency and its last movements; `refreshKey` changes after the person opens the daily gift. */
export default function CoinWalletCard({ token, refreshKey }: { token: string; refreshKey: number }) {
  const [wallet, setWallet] = useState<CoinWallet | null>(null)

  useEffect(() => {
    let cancelled = false
    getCoins(token).then(({ data }) => { if (!cancelled && data) setWallet(data) })
    return () => { cancelled = true }
  }, [token, refreshKey])

  if (!wallet) return null
  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-4" aria-label={`Ví ${wallet.coinName}`}>
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-base font-extrabold">Ví <BrandText text={wallet.coinName} coinName={wallet.coinName} /></h2>
        <span className="inline-flex items-center gap-1.5 text-xl font-black text-[#b45309]"><CoinIcon className="size-6" /> {wallet.balance}</span>
      </div>
      <p className="mb-0 mt-1 text-sm text-muted"><BrandText text={wallet.coinName} coinName={wallet.coinName} /> là tiền riêng của các trò chơi, không phải anyPoint.</p>
      {wallet.history.length > 0 && (
        <ul className="m-0 mt-3 grid list-none gap-1.5 p-0">
          {wallet.history.slice(0, 5).map(row => (
            <li key={row.id} className="flex items-center justify-between text-sm">
              <span className="text-muted">{SOURCE_LABEL[row.source] ?? row.source}</span>
              <b className={row.delta > 0 ? 'text-green-dark' : 'text-warn-text'}>{row.delta > 0 ? '+' : ''}{row.delta}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
