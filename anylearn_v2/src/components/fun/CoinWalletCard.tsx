'use client'

import BrandText from './BrandText'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronRightIcon } from '@/components/icons'
import CoinIcon from './CoinIcon'
import { getCoins, type CoinWallet } from '@/lib/api/fun'

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
    <Link href="/fun/coins" className="mt-4 block rounded-2xl border border-line bg-white p-4 text-inherit no-underline" aria-label={`Xem lịch sử ${wallet.coinName}`}>
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-base font-extrabold">Ví <BrandText text={wallet.coinName} coinName={wallet.coinName} /></h2>
        <span className="inline-flex items-center gap-1.5 text-xl font-black text-[#b45309]"><CoinIcon className="size-6" /> {wallet.balance}<ChevronRightIcon className="size-5 text-muted" /></span>
      </div>
      <p className="mb-0 mt-1 text-sm text-muted"><BrandText text={wallet.coinName} coinName={wallet.coinName} /> là tiền riêng của các trò chơi, không phải anyPoint.</p>
    </Link>
  )
}
