'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import ApplyRow from '@/components/cart/ApplyRow'
import { getVouchersForCart, quoteVoucher, type WalletVoucher } from '@/lib/api/vouchers'
import { bestVoucher, conditionLine, expiryLabel, formatVnd, sortForCheckout } from '@/lib/vouchers/rules'

export interface VoucherChoice {
  walletId?: number
  code?: string
  label: string
  discount: number
}

interface Props {
  token: string
  // Changes when the cart changes, so the list is checked again.
  cartKey: string
  value: VoucherChoice | null
  onChange: (choice: VoucherChoice | null) => void
}

/**
 * Checkout voucher box (plan 20): the voucher wallet first (vouchers that fit the cart, the best one pre-selected, the
 * others greyed with the reason), a link to the wallet page, then "Có mã giảm giá?" that opens the code field.
 */
export default function VoucherPicker({ token, cartKey, value, onChange }: Props) {
  const [items, setItems] = useState<WalletVoucher[]>([])
  const [loaded, setLoaded] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  // The code field stays a short text link until the person opens it (as in the old checkout).
  const [codeOpen, setCodeOpen] = useState(false)

  useEffect(() => {
    let alive = true
    getVouchersForCart(token).then(list => {
      if (!alive) return
      setItems(list)
      setLoaded(true)
      const best = bestVoucher(list)
      // Keep a typed code; otherwise follow the cart: the best wallet voucher, or none when the chosen one stopped fitting.
      if (value?.code && !value.walletId) return
      const still = value?.walletId ? list.find(v => v.id === value.walletId && !v.problem && (v.discount ?? 0) > 0) : null
      const pick = still ?? best
      onChange(pick ? { walletId: pick.id, label: pick.title, discount: pick.discount ?? 0 } : null)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, cartKey])

  const sorted = sortForCheckout(items)
  const visible = showAll ? sorted : sorted.slice(0, 3)

  const applyCode = async () => {
    if (!code.trim()) return
    setCodeLoading(true)
    setCodeError('')
    const { data, error } = await quoteVoucher(code.trim(), token)
    setCodeLoading(false)
    if (error || !data) { setCodeError(error || 'Mã không hợp lệ'); return }
    onChange(data.walletId
      ? { walletId: data.walletId, label: data.title ?? data.code, discount: data.discountValue }
      : { code: data.code, label: `Mã ${data.code}`, discount: data.discountValue })
    setCode('')
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-ink">Ví voucher của bạn{loaded ? ` (${sorted.length})` : ''}</span>
        <Link href="/account/vouchers" className="font-semibold text-green-dark no-underline">Xem ví ›</Link>
      </div>
      {loaded && sorted.length === 0 && (
        <p className="m-0 rounded-xl border border-dashed border-line bg-bg px-3 py-2.5 text-xs text-muted">
          Ví chưa có voucher. Voucher bạn nhận từ Hành trình, sự kiện hay nhập mã sẽ nằm ở đây.
        </p>
      )}
      {loaded && sorted.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Voucher trong ví">
          {visible.map(v => {
            const usable = !v.problem && (v.discount ?? 0) > 0
            const selected = value?.walletId === v.id
            const exp = expiryLabel(v.expiresAt)
            return (
              <li key={v.id}>
                <button
                  type="button"
                  disabled={!usable}
                  aria-pressed={selected}
                  onClick={() => onChange(selected ? null : { walletId: v.id, label: v.title, discount: v.discount ?? 0 })}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left font-[inherit] ${
                    selected ? 'border-green bg-green-soft' : 'border-line bg-white'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-green text-xs font-extrabold text-white">
                    {Math.round(v.value / 1000)}K
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{v.title}</span>
                    <span className="block text-xs text-muted">{conditionLine(v)}{exp ? ` · ${exp}` : ''}</span>
                    {!usable && v.problem && <span className="block text-xs text-red">{v.problem}</span>}
                  </span>
                  {usable && (
                    <span className="shrink-0 text-right text-sm font-bold text-green-dark">−{formatVnd(v.discount ?? 0)}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {sorted.length > 3 && (
        <button type="button" onClick={() => setShowAll(s => !s)}
          className="cursor-pointer self-start border-0 bg-transparent p-0 font-[inherit] text-xs font-medium text-green-dark underline">
          {showAll ? 'Thu gọn' : `Xem thêm ${sorted.length - 3} voucher`}
        </button>
      )}
      {value?.code && !value.walletId && (
        <div className="flex items-center justify-between rounded-xl border border-green bg-green-soft p-3 text-sm">
          <span className="font-bold text-ink">{value.label}</span>
          <span className="flex items-center gap-3">
            <span className="font-bold text-green-dark">−{formatVnd(value.discount)}</span>
            <button type="button" onClick={() => onChange(null)} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-xs text-muted underline">Bỏ</button>
          </span>
        </div>
      )}
      {codeOpen ? (
        <ApplyRow
          label="Mã giảm giá"
          inputProps={{ type: 'text', placeholder: 'Nhập mã giảm giá', value: code, onChange: e => { setCode(e.target.value); setCodeError('') } }}
          buttonLabel={codeLoading ? '...' : 'Áp dụng'}
          onApply={applyCode}
          disabled={codeLoading}
          message={codeError ? { kind: 'error', text: codeError } : null}
        />
      ) : (
        <button type="button" onClick={() => setCodeOpen(true)}
          className="cursor-pointer self-start border-0 bg-transparent p-0 font-[inherit] text-sm font-semibold text-green-dark underline">
          Có mã giảm giá? Nhập mã
        </button>
      )}
    </div>
  )
}
