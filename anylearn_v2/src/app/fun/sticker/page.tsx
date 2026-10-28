'use client'

import BrandText from '@/components/fun/BrandText'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { claimSetReward, getAlbum, sendDevice, type Album } from '@/lib/api/stickers'
import { deviceId } from '@/lib/stickers/device'
import { itemsOfCollection, progressText, rewardLine, selectCollection } from '@/lib/stickers/rules'
import { ChevronLeftIcon } from '@/components/icons'
import CollectionTabs from '@/components/fun/sticker/CollectionTabs'
import StickerTile from '@/components/fun/sticker/StickerTile'
import TradePanel from '@/components/fun/sticker/TradePanel'
import OffersCard from '@/components/fun/sticker/OffersCard'
import InviteCard from '@/components/fun/sticker/InviteCard'

export default function StickerPage() {
  const { token } = useAuth()
  const [album, setAlbum] = useState<Album | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    const { data, error: err } = await getAlbum(token)
    if (err || !data) return setError(err ?? 'Không tải được album')
    setError('')
    setAlbum(data)
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    const id = deviceId()
    if (token && id) sendDevice(token, id)
  }, [token])

  const current = album ? selectCollection(album.collections, picked) : null

  const done = (text?: string) => {
    if (text) setNote(text)
    load()
  }

  const claim = async (collectionId: number) => {
    if (!token) return
    const { data, error: err } = await claimSetReward(token, collectionId)
    setNote(err ?? `Chúc mừng! Bạn nhận ${data?.points ?? 0} ${album?.coinName ?? 'Leo Xu'} vì đủ bộ ${data?.collection ?? 'sticker'}.`)
    load()
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      <h1 className="m-0 text-2xl font-black lg:text-3xl">Sticker</h1>
      {error && <p className="mt-4 text-warn-text">{error}</p>}
      {!error && !album && <div className="mt-4 h-60 animate-pulse rounded-2xl bg-slate-200" />}
      {album && token && (
        <div className="mt-3 grid gap-4">
          <div>
            <div className="flex items-center justify-between text-sm font-bold"><span>Đã sưu tầm</span><span>{progressText(album.owned, album.total)}</span></div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={album.owned} aria-valuemax={album.total}>
              <div className="h-full rounded-full bg-green" style={{ width: `${album.total ? (album.owned / album.total) * 100 : 0}%` }} />
            </div>
          </div>
          {!album.enabled && <p className="m-0 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Game sticker đang tạm nghỉ, album của bạn vẫn được giữ nguyên.</p>}
          {note && <p className="m-0 rounded-xl bg-green-soft p-3 text-sm font-bold text-green-dark" role="status"><BrandText text={note} coinName={album?.coinName} /></p>}

          <Link href="/fun/shop?tab=buy&game=sticker" className="flex min-h-12 items-center justify-between rounded-2xl bg-white px-4 text-sm font-extrabold text-ink no-underline ring-1 ring-line">
            <span>Mua rương sticker bằng <BrandText text={album.coinName} coinName={album.coinName} /></span><span aria-hidden className="text-muted">›</span>
          </Link>

          <CollectionTabs collections={album.collections} selectedId={current?.id ?? null} onSelect={setPicked} />
          {current && (
            <section aria-label={current.name} className="grid gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="m-0 text-lg font-extrabold"><BrandText text={current.name} coinName={album.coinName} /></h2>
                  <span className="text-sm font-bold">{progressText(current.owned, current.total)}</span>
                </div>
                {current.description && <p className="m-0 mt-0.5 text-sm text-muted">{current.description}</p>}
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={current.owned} aria-valuemax={current.total}>
                  <div className="h-full rounded-full bg-green" style={{ width: `${current.total ? (current.owned / current.total) * 100 : 0}%` }} />
                </div>
                {!current.active && <p className="m-0 mt-2 rounded-xl bg-amber-50 p-2 text-sm text-amber-900">Bộ này đã khép lại, sticker của bạn vẫn được giữ nguyên.</p>}
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {itemsOfCollection(album.items, current.id).map(item => <StickerTile key={item.id} item={item} />)}
              </div>
              {rewardLine(current) !== 'none' && (
                <div className="rounded-2xl border border-line bg-white p-4 text-sm">
                  {rewardLine(current) === 'claimed' && <span>Bạn đã nhận thưởng đủ bộ này. Giỏi quá!</span>}
                  {rewardLine(current) === 'ready' && (
                    <div className="flex flex-wrap items-center gap-3"><span className="font-bold">Bạn đã đủ bộ!</span><button type="button" onClick={() => claim(current.id)} className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 font-black text-white">Nhận {current.rewardPoints} {album.coinName}</button></div>
                  )}
                  {rewardLine(current) === 'pending' && <span>Sưu tầm đủ bộ để nhận <b className="font-extrabold not-italic text-green">{current.rewardPoints} {album.coinName}</b>.</span>}
                </div>
              )}
            </section>
          )}

          <Link href="/fun/sticker/market" className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 text-text no-underline">
            <span><b className="block text-base font-extrabold">Chợ đổi sticker</b><span className="text-sm text-muted">Đăng &quot;mình có a, b, c, cần x&quot; hoặc tìm bạn đổi ngay.</span></span>
            <span aria-hidden className="text-xl font-black text-green">›</span>
          </Link>
          <OffersCard token={token} title="Lời mời đổi dành cho bạn" offers={album.incoming} incoming onDone={done} />
          <TradePanel token={token} items={album.items} eligible={album.eligible} onSent={() => done()} />
          <OffersCard token={token} title="Lời mời bạn đã gửi" offers={album.outgoing} incoming={false} onDone={done} />
          <InviteCard token={token} album={album} />
        </div>
      )}
    </div>
  )
}
