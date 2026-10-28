'use client'

import BrandText from '@/components/fun/BrandText'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { claimSetReward, getAlbum, sendDevice, type Album } from '@/lib/api/stickers'
import { deviceId } from '@/lib/stickers/device'
import { progressText } from '@/lib/stickers/rules'
import { ChevronLeftIcon } from '@/components/icons'
import StickerTile from '@/components/fun/sticker/StickerTile'
import TradePanel from '@/components/fun/sticker/TradePanel'
import OffersCard from '@/components/fun/sticker/OffersCard'
import InviteCard from '@/components/fun/sticker/InviteCard'

export default function StickerPage() {
  const { token } = useAuth()
  const [album, setAlbum] = useState<Album | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

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

  const done = (text?: string) => {
    if (text) setNote(text)
    load()
  }

  const claim = async () => {
    if (!token) return
    const { data, error: err } = await claimSetReward(token)
    setNote(err ?? `Chúc mừng! Bạn nhận ${data?.points ?? 0} ${album?.coinName ?? 'Leo Xu'} vì đủ bộ sticker.`)
    load()
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/today/fun" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
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

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {album.items.map(item => <StickerTile key={item.id} item={item} />)}
          </div>

          {album.setReward > 0 && (
            <div className="rounded-2xl border border-line bg-white p-4 text-sm">
              {album.setRewardClaimed
                ? <span>Bạn đã nhận thưởng đủ bộ. Giỏi quá!</span>
                : album.setComplete
                  ? <div className="flex flex-wrap items-center gap-3"><span className="font-bold">Bạn đã đủ bộ!</span><button type="button" onClick={claim} className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 font-black text-white">Nhận {album.setReward} {album.coinName}</button></div>
                  : <span>Sưu tầm đủ bộ để nhận <b className="font-extrabold not-italic text-green">{album.setReward} {album.coinName}</b>.</span>}
            </div>
          )}

          <OffersCard token={token} title="Lời mời đổi dành cho bạn" offers={album.incoming} incoming onDone={done} />
          <TradePanel token={token} items={album.items} eligible={album.eligible} onSent={() => done()} />
          <OffersCard token={token} title="Lời mời bạn đã gửi" offers={album.outgoing} incoming={false} onDone={done} />
          <InviteCard token={token} album={album} />
        </div>
      )}
    </div>
  )
}
