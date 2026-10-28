'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getAlbum, getMarket, type Album, type MarketPage, type MarketTab } from '@/lib/api/stickers'
import { slotsLeft } from '@/lib/stickers/market'
import { ChevronLeftIcon } from '@/components/icons'
import CreateListing from '@/components/fun/sticker/CreateListing'
import ListingCard from '@/components/fun/sticker/ListingCard'

const TABS: { key: MarketTab; label: string }[] = [
  { key: 'match', label: 'Có cái tôi cần' },
  { key: 'all', label: 'Tất cả' },
  { key: 'mine', label: 'Tin của tôi' },
]

const EMPTY: Record<MarketTab, string> = {
  match: 'Chưa có tin nào vừa ý bạn. Hãy xem tab Tất cả hoặc tự đăng tin nhé!',
  all: 'Chợ đang vắng. Bạn hãy là người đăng tin đầu tiên!',
  mine: 'Bạn chưa đăng tin nào.',
}

export default function StickerMarketPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState<MarketTab>('match')
  const [page, setPage] = useState(1)
  const [market, setMarket] = useState<MarketPage | null>(null)
  const [album, setAlbum] = useState<Album | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    const [m, a] = await Promise.all([getMarket(token, tab, page), getAlbum(token)])
    if (m.error || !m.data) return setError(m.error ?? 'Không tải được chợ sticker')
    setError('')
    setMarket(m.data)
    if (a.data) setAlbum(a.data)
  }, [token, tab, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const done = (text?: string) => {
    if (text) setNote(text)
    setCreating(false)
    load()
  }

  const left = market ? slotsLeft(market.openCount, market.maxListings) : 0
  const pages = market ? Math.max(Math.ceil(market.total / market.pageSize), 1) : 1

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun/sticker" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Sticker</Link>
      <h1 className="m-0 text-2xl font-black lg:text-3xl">Chợ đổi sticker</h1>
      <p className="mb-0 mt-1 text-sm text-muted">Đăng &quot;Mình có a, b, c, cần x&quot;. Ai có x và thiếu một trong a, b, c sẽ đổi với bạn ngay. Không tốn xu.</p>

      {error && <p className="mt-4 text-warn-text">{error}</p>}
      {!error && !market && <div className="mt-4 h-60 animate-pulse rounded-2xl bg-slate-200" />}
      {market && token && album && (
        <div className="mt-3 grid gap-4">
          {note && <p className="m-0 rounded-xl bg-green-soft p-3 text-sm font-bold text-green-dark" role="status">{note}</p>}
          {!album.eligible && <p className="m-0 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Bạn cần dùng anyLEARN thêm vài ngày và điểm danh đủ ngày mới đăng tin và đổi sticker được.</p>}

          <section className="rounded-2xl border border-line bg-white p-4" aria-label="Đăng tin">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="m-0 text-base font-extrabold">Đăng tin mới</h2>
              <span className="text-xs text-muted">Còn {left}/{market.maxListings} tin · tin hết hạn sau {market.listingDays} ngày</span>
            </div>
            {creating
              ? (
                <div className="mt-3">
                  <CreateListing token={token} items={album.items} days={market.listingDays} onDone={done} />
                  <button type="button" onClick={() => setCreating(false)} className="mt-2 min-h-11 cursor-pointer border-0 bg-transparent px-0 text-sm font-bold text-muted">Đóng</button>
                </div>
              )
              : (
                <button type="button" disabled={left === 0 || !album.eligible} onClick={() => setCreating(true)}
                  className="mt-3 min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-[15px] font-black text-white disabled:opacity-50">
                  {left === 0 ? 'Đã đủ số tin, hãy gỡ bớt' : 'Đăng tin'}
                </button>
              )}
          </section>

          <div role="tablist" className="flex gap-2 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); setPage(1) }}
                className={`min-h-11 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-bold ${tab === t.key ? 'border-green bg-green text-white' : 'border-line bg-white text-text'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {market.items.length === 0
            ? <p className="m-0 text-sm text-muted">{EMPTY[tab]}</p>
            : <div className="grid gap-3">{market.items.map(l => <ListingCard key={l.id} listing={l} token={token} eligible={album.eligible} onDone={done} />)}</div>}

          {tab !== 'mine' && pages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm font-bold">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="min-h-11 cursor-pointer rounded-full border border-line bg-white px-4 disabled:opacity-40">Trước</button>
              <span>{page}/{pages}</span>
              <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)} className="min-h-11 cursor-pointer rounded-full border border-line bg-white px-4 disabled:opacity-40">Sau</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
