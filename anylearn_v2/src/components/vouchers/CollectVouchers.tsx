'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import VoucherTicket from '@/components/vouchers/VoucherTicket'
import { collectVoucher, getCollectibleVouchers, type CollectibleVoucher, type VoucherPlace } from '@/lib/api/vouchers'
import { CheckIcon } from '@/components/icons'
import { conditionLine, leftLabel } from '@/lib/vouchers/rules'

interface Props {
  place: VoucherPlace
  partnerId?: number
  itemId?: number
  title?: string
  className?: string
}

/**
 * "Nhận voucher" strip (plan 20): vouchers people can collect at this place. Hidden when there are none.
 * A visitor gets the login form; a collected voucher goes to the wallet and is used at checkout.
 */
export default function CollectVouchers({ place, partnerId, itemId, title = 'Voucher cho bạn', className = '' }: Props) {
  const { token, openAuthModal } = useAuth()
  const [items, setItems] = useState<CollectibleVoucher[]>([])
  const [busy, setBusy] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true
    getCollectibleVouchers({ place, partnerId, itemId }, token).then(list => { if (alive) setItems(list) })
    return () => { alive = false }
  }, [place, partnerId, itemId, token])

  if (items.length === 0) return null

  const collect = async (v: CollectibleVoucher) => {
    if (!token) { openAuthModal('login'); return }
    setBusy(v.groupId)
    setMessage('')
    const { error } = await collectVoucher(v.groupId, token)
    setBusy(null)
    if (error) { setMessage(error); return }
    setItems(list => list.map(x => (x.groupId === v.groupId ? { ...x, collected: true, left: x.left == null ? x.left : Math.max(0, x.left - 1) } : x)))
    setMessage('Đã lưu vào ví voucher, dùng khi thanh toán.')
  }

  return (
    <section className={`min-w-0 ${className}`} aria-label={title}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-extrabold text-ink">{title}</h2>
        {token && <Link href="/account/vouchers" className="text-sm font-bold text-green-dark">Ví voucher</Link>}
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {items.map(v => {
          const left = leftLabel(v)
          const soldOut = v.left != null && v.left <= 0
          return (
            <div key={v.groupId} className="w-[300px] max-w-[85vw] shrink-0 snap-start">
              <VoucherTicket
                value={v.value}
                title={v.title}
                condition={conditionLine(v)}
                note={left}
                warn={v.left != null && v.left > 0 && v.left <= 10}
                vivid
                action={v.collected ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-green-dark"><CheckIcon className="size-4" />Đã lưu</span>
                ) : soldOut ? (
                  <span className="shrink-0 text-xs font-bold text-muted">Đã hết</span>
                ) : (
                  <button
                    type="button"
                    disabled={busy === v.groupId}
                    onClick={() => collect(v)}
                    className="min-h-9 shrink-0 cursor-pointer rounded-full border-0 bg-gradient-to-r from-[#ff8a3d] to-[#e8336d] px-3.5 font-[inherit] text-xs font-black text-white shadow-[0_2px_8px_rgba(232,51,109,.35)] hover:brightness-105 disabled:opacity-70"
                  >
                    {busy === v.groupId ? '...' : 'Lưu ngay'}
                  </button>
                )}
              />
            </div>
          )
        })}
      </div>
      {message && <p className="m-0 mt-2 text-xs font-bold text-green-dark" role="status">{message}</p>}
    </section>
  )
}
