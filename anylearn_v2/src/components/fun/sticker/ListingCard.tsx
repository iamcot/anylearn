'use client'

import BrandText from '../BrandText'
import { useState } from 'react'
import { removeListing, takeListing, type MarketListing } from '@/lib/api/stickers'
import { expiresText, STATUS_LABEL, takeChoices } from '@/lib/stickers/market'
import StickerArt from './StickerArt'

/** One market post: "Mình có a, b, c, cần x". Others press "Đổi" and pick one of a, b, c; the owner can remove it. */
export default function ListingCard({ listing, token, eligible, onDone }: { listing: MarketListing; token: string; eligible: boolean; onDone: (note?: string) => void }) {
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const open = listing.status === 'open'
  const choices = takeChoices(listing)

  const run = async (fn: () => Promise<{ error?: string; data?: unknown }>, note: (name?: string) => string) => {
    setBusy(true)
    setError('')
    const res = await fn()
    setBusy(false)
    if (res.error) setError(res.error)
    else onDone(note((res.data as { received?: { name: string } } | null)?.received?.name))
  }

  return (
    <article className="rounded-2xl border border-line bg-white p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-extrabold">{listing.userName}</span>
        <span className="text-xs text-muted">{open ? expiresText(listing.expiresAt) : STATUS_LABEL[listing.status]}</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-3">
        <div>
          <div className="mb-1 text-xs font-bold text-muted">Có</div>
          <div className="flex flex-wrap gap-2">
            {listing.offers.map(offer => (
              <span key={offer.id} className={`grid w-16 justify-items-center gap-0.5 text-center ${listing.canTake && !offer.lacking ? 'opacity-50' : ''}`}>
                <span className="size-14"><StickerArt sticker={offer} /></span>
                <span className="line-clamp-1 text-[11px] font-bold leading-tight"><BrandText text={offer.name} /></span>
                {listing.status === 'open' && !listing.mine && offer.lacking && <span className="rounded-full bg-green-soft px-1.5 text-[10px] font-bold text-green-dark">Bạn thiếu</span>}
              </span>
            ))}
          </div>
        </div>
        <span aria-hidden className="text-xl font-black text-muted">⇄</span>
        <div className="grid w-16 justify-items-center gap-0.5 text-center">
          <div className="mb-1 text-xs font-bold text-muted">Cần</div>
          <span className="size-14"><StickerArt sticker={listing.want} /></span>
          <span className="line-clamp-1 text-[11px] font-bold leading-tight"><BrandText text={listing.want.name} /></span>
        </div>
      </div>

      {open && listing.mine && (
        <button type="button" disabled={busy} onClick={() => run(() => removeListing(token, listing.id), () => 'Đã gỡ tin, sticker của bạn được mở khóa.')}
          className="mt-3 min-h-11 cursor-pointer rounded-full border border-line bg-white px-4 text-sm font-bold text-text disabled:opacity-50">Gỡ tin</button>
      )}
      {open && !listing.mine && (
        picking
          ? (
            <div className="mt-3 grid gap-2">
              <p className="m-0 text-sm font-bold text-green-dark">Chọn sticker bạn muốn nhận (bạn đưa {listing.want.name})</p>
              <div className="flex flex-wrap gap-2">
                {choices.map(offer => (
                  <button key={offer.id} type="button" disabled={busy || !eligible}
                    onClick={() => run(() => takeListing(token, listing.id, offer.id), name => `Đổi xong! Bạn nhận được ${name ?? 'sticker mới'}.`)}
                    className="grid w-20 cursor-pointer justify-items-center gap-0.5 rounded-xl border-2 border-green bg-white p-1 disabled:opacity-50">
                    <span className="size-14"><StickerArt sticker={offer} /></span>
                    <span className="line-clamp-1 text-[11px] font-bold"><BrandText text={offer.name} /></span>
                  </button>
                ))}
                <button type="button" onClick={() => setPicking(false)} className="min-h-11 cursor-pointer self-center border-0 bg-transparent px-2 text-sm font-bold text-muted">Thôi</button>
              </div>
            </div>
          )
          : listing.canTake
            ? <button type="button" disabled={!eligible} onClick={() => setPicking(true)} className="mt-3 min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-black text-white disabled:opacity-50">Đổi</button>
            : <p className="m-0 mt-3 text-xs text-muted">{choices.length === 0 ? 'Bạn đã có hết các sticker trong tin này.' : `Bạn chưa có sticker trùng ${listing.want.name} để đổi.`}</p>
      )}
      {error && <p className="m-0 mt-2 text-sm text-warn-text" role="alert">{error}</p>}
    </article>
  )
}
