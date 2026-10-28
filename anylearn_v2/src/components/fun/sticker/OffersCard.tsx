'use client'

import BrandText from '../BrandText'
import { useState } from 'react'
import { acceptOffer, cancelOffer, declineOffer, type StickerOffer } from '@/lib/api/stickers'
import StickerArt from './StickerArt'

function Row({ offer, incoming, token, onDone }: { offer: StickerOffer; incoming: boolean; token: string; onDone: (note?: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async (fn: () => Promise<{ error?: string }>, note?: string) => {
    setBusy(true)
    setError('')
    const res = await fn()
    setBusy(false)
    if (res.error) setError(res.error)
    else onDone(note)
  }
  const giveText = incoming ? 'đưa bạn' : 'bạn đưa'
  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex items-center gap-3">
        <span className="size-11 shrink-0"><StickerArt sticker={offer.give} /></span>
        <span aria-hidden>⇄</span>
        <span className="size-11 shrink-0"><StickerArt sticker={offer.want} /></span>
        <div className="min-w-0 flex-1 text-sm">
          <b>{offer.otherName}</b> {giveText} <b><BrandText text={offer.give.name} /></b>, đổi lấy <b><BrandText text={offer.want.name} /></b>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        {incoming ? (
          <>
            <button type="button" disabled={busy} onClick={() => run(() => acceptOffer(token, offer.id), `Đã đổi! Bạn nhận được ${offer.give.name}.`)} className="min-h-10 cursor-pointer rounded-full border-0 bg-green px-4 text-sm font-black text-white">Đồng ý đổi</button>
            <button type="button" disabled={busy} onClick={() => run(() => declineOffer(token, offer.id))} className="min-h-10 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-bold">Từ chối</button>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => run(() => cancelOffer(token, offer.id))} className="min-h-10 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-bold">Hủy lời mời</button>
        )}
      </div>
      {error && <p className="mb-0 mt-2 text-sm text-warn-text">{error}</p>}
    </li>
  )
}

export default function OffersCard({ token, title, offers, incoming, onDone }: { token: string; title: string; offers: StickerOffer[]; incoming: boolean; onDone: (note?: string) => void }) {
  if (offers.length === 0) return null
  return (
    <section className="rounded-2xl border border-line bg-white p-4" aria-label={title}>
      <h2 className="m-0 mb-3 text-base font-extrabold">{title}</h2>
      <ul className="m-0 grid list-none gap-2 p-0">{offers.map(o => <Row key={o.id} offer={o} incoming={incoming} token={token} onDone={onDone} />)}</ul>
    </section>
  )
}
