'use client'

import { useState } from 'react'
import BrandText from '@/components/fun/BrandText'
import CoinIcon from '@/components/fun/CoinIcon'
import VoucherTicket from './VoucherTicket'
import type { ShopEntry } from '@/lib/api/shop'
import { conditionLine, leoVoucherNote } from '@/lib/vouchers/rules'

/**
 * A voucher sold for Leo Xu (shop "Mua" tab and the voucher wallet page): the Leo ticket with the price button.
 * The first tap asks to confirm, the second buys; `onBuy` returns the error text (null = bought).
 */
export default function LeoVoucherCard({ entry, coins, coinName, onBuy, as = 'li' }: {
  entry: ShopEntry
  coins: number
  coinName: string
  onBuy: (entry: ShopEntry) => Promise<string | null>
  /** 'div' inside a horizontal strip (CollectVouchers), 'li' inside a list. */
  as?: 'li' | 'div'
}) {
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const v = entry.voucher
  if (!v) return null

  const short = coins < v.price
  const blocked = !entry.enabled || v.holding || !!v.nextAt || (v.left !== null && v.left <= 0)
  const note = !entry.enabled ? 'Tạm ngừng đổi' : leoVoucherNote(v)

  const press = async () => {
    if (!confirm) { setConfirm(true); setError(''); return }
    setBusy(true)
    const err = await onBuy(entry)
    setBusy(false)
    setConfirm(false)
    if (err) setError(err)
  }

  const button = (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={press}
        disabled={busy || blocked || short}
        aria-label={`Đổi voucher ${v.title} với ${v.price} ${coinName}`}
        className={`inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full border-0 px-3 font-[inherit] text-sm font-black shadow-sm disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-muted disabled:shadow-none ${
          confirm ? 'bg-[#b45309] text-white' : 'bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#5b2a06]'
        }`}
      >
        {busy ? '...' : confirm ? 'Xác nhận' : <><CoinIcon className="size-4" />{v.price}</>}
      </button>
      {confirm && !busy && (
        <button type="button" onClick={() => setConfirm(false)} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[11px] font-bold text-muted">Hủy</button>
      )}
      {short && !blocked && <span className="text-[11px] font-bold text-muted">Chưa đủ xu</span>}
    </div>
  )

  const Wrap = as
  return (
    <Wrap className="h-full list-none">
      <VoucherTicket
        leo
        value={v.value}
        kind={v.kind}
        title={v.title}
        condition={conditionLine(v)}
        note={confirm ? `Đổi ${v.price} ${coinName} lấy voucher này?` : note}
        warn={!!error}
        dim={blocked}
        badge={<span className="inline-flex items-center gap-1"><CoinIcon className="size-3.5" /><span>Đổi bằng <BrandText text={coinName} coinName={coinName} /></span></span>}
        action={button}
      />
      {error && <p role="alert" className="m-0 mt-1 px-1 text-xs font-bold text-warn-text">{error}</p>}
    </Wrap>
  )
}
