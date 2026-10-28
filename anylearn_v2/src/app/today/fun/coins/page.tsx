'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import BrandText from '@/components/fun/BrandText'
import CoinIcon from '@/components/fun/CoinIcon'
import { getCoinHistory, type CoinHistoryPage } from '@/lib/api/fun'
import { coinSourceLabel, pageCount } from '@/lib/fun/coins'

const PAGE_SIZE = 20

function dateText(value: string): string {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function CoinHistoryPage() {
  const { token } = useAuth()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<CoinHistoryPage | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getCoinHistory(token, page, PAGE_SIZE).then(({ data: d, error: err }) => {
      if (cancelled) return
      if (err || !d) return setError(err ?? 'Không tải được lịch sử')
      setError('')
      setData(d)
    })
    return () => { cancelled = true }
  }, [token, page])

  const pages = data ? pageCount(data.total, data.size) : 1

  return (
    <main className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <Link href="/today/fun" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      {data && (
        <div className="flex items-center justify-between">
          <h1 className="m-0 text-xl font-extrabold">Lịch sử <BrandText text={data.coinName} coinName={data.coinName} /></h1>
          <span className="inline-flex items-center gap-1.5 text-xl font-black text-[#b45309]"><CoinIcon className="size-6" /> {data.balance}</span>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-warn-text">{error}</p>}
      {data && data.items.length === 0 && <p className="mt-4 text-sm text-muted">Chưa có giao dịch nào.</p>}
      {data && data.items.length > 0 && (
        <ul className="m-0 mt-4 grid list-none gap-2 p-0">
          {data.items.map(row => (
            <li key={row.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-line">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{coinSourceLabel(row.source)}</div>
                <div className="truncate text-xs text-muted">{dateText(row.createdAt)}{row.detail ? ` · ${row.detail}` : ''}</div>
              </div>
              <div className="shrink-0 text-right">
                <b className={row.delta > 0 ? 'text-green-dark' : 'text-warn-text'}>{row.delta > 0 ? '+' : ''}{row.delta}</b>
                <div className="text-xs text-muted">còn {row.balanceAfter}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Phân trang">
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-full border border-line bg-white px-4 py-2 font-bold disabled:opacity-40">Trước</button>
          <span className="text-muted">Trang {page}/{pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="rounded-full border border-line bg-white px-4 py-2 font-bold disabled:opacity-40">Sau</button>
        </nav>
      )}
    </main>
  )
}
