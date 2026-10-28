'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import BrandText from '@/components/fun/BrandText'
import CoinIcon from '@/components/fun/CoinIcon'
import BuyTab from '@/components/fun/shop/BuyTab'
import SellTab from '@/components/fun/shop/SellTab'
import HistoryTab from '@/components/fun/shop/HistoryTab'
import { getShop, type Shop } from '@/lib/api/shop'
import { gameFromQuery, SHOP_TABS, shopTabFromQuery } from '@/lib/shop/rules'

function ShopContent() {
  const { token } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const tab = shopTabFromQuery(params.get('tab'))
  const only = gameFromQuery(params.get('game'))
  const [shop, setShop] = useState<Shop | null>(null)
  const [error, setError] = useState('')
  const [changes, setChanges] = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    const { data, error: err } = await getShop(token)
    if (err || !data) return setError(err ?? 'Không tải được cửa hàng')
    setError('')
    setShop(data)
    setChanges(n => n + 1)
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const open = (next: string) => router.replace(`/fun/shop?tab=${next}`, { scroll: false })

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-2xl font-black lg:text-3xl">Cửa hàng <BrandText text={shop?.coinName ?? 'Leo Xu'} coinName={shop?.coinName} /></h1>
        {shop && <span className="inline-flex items-center gap-1.5 text-xl font-black text-[#b45309]" title={shop.coinName}><CoinIcon className="size-6" /> {shop.coins}</span>}
      </div>
      <p className="mt-1 text-sm text-muted"><BrandText text="Leo Xu" coinName={shop?.coinName} /> chỉ dùng trong Vui học, không phải anyPoint và không đổi ra tiền.</p>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 ring-1 ring-line" role="tablist" aria-label="Cửa hàng">
        {SHOP_TABS.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => open(t.key)}
            className={`min-h-11 cursor-pointer rounded-xl border-0 text-sm font-extrabold ${tab === t.key ? 'bg-green text-white' : 'bg-transparent text-ink'}`}>{t.label}</button>
        ))}
      </div>

      {error && <p className="mt-4 text-warn-text" role="alert">{error}</p>}
      {!error && !shop && <div className="mt-4 h-60 animate-pulse rounded-2xl bg-slate-200" />}
      {shop && token && tab === 'buy' && <BuyTab token={token} shop={shop} only={only} onChanged={load} />}
      {shop && token && tab === 'sell' && <SellTab token={token} shop={shop} onChanged={load} />}
      {token && tab === 'history' && <HistoryTab token={token} refreshKey={changes} />}
    </div>
  )
}

export default function ShopPage() {
  return <Suspense fallback={<div className="mx-auto mt-6 h-60 max-w-[720px] animate-pulse rounded-2xl bg-slate-200" />}><ShopContent /></Suspense>
}
