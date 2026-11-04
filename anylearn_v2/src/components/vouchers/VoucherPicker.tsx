'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import ApplyRow from '@/components/cart/ApplyRow'
import { ChevronRightIcon, CloseIcon, TagIcon } from '@/components/icons'
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
 * Checkout voucher box (plan 20): one row "Ví voucher (n)" with the chosen voucher (the best one is pre-selected); a tap
 * opens the wallet as a popup (a sheet from the bottom on a phone, at least half the screen) where the vouchers that fit
 * the cart can be picked and the others are greyed with the reason. Below, "Có mã giảm giá?" opens the code field.
 */
export default function VoucherPicker({ token, cartKey, value, onChange }: Props) {
  const [items, setItems] = useState<WalletVoucher[]>([])
  const [loaded, setLoaded] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  // The code field stays a short text link until the person opens it (as in the old checkout).
  const [codeOpen, setCodeOpen] = useState(false)
  // The person chose "Không dùng voucher": a later cart change does not pick the best one again.
  const declined = useRef(false)
  const [noVoucher, setNoVoucher] = useState(false)

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
      const pick = still ?? (declined.current ? null : best)
      onChange(pick ? { walletId: pick.id, label: pick.title, discount: pick.discount ?? 0 } : null)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, cartKey])

  const sorted = sortForCheckout(items)
  const chosen = value?.walletId ? items.find(v => v.id === value.walletId) : null

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
      <button type="button" onClick={() => setSheetOpen(true)}
        className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left font-[inherit]">
        <TagIcon className="size-5 shrink-0 text-green" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">Ví voucher{loaded ? ` (${sorted.length})` : ''}</span>
          <span className="block truncate text-xs text-muted">{chosen ? chosen.title : sorted.length === 0 ? 'Chưa có voucher' : noVoucher ? 'Không dùng voucher' : 'Chọn voucher'}</span>
        </span>
        {chosen && <span className="shrink-0 text-sm font-bold text-green-dark">−{formatVnd(value?.discount ?? 0)}</span>}
        <ChevronRightIcon className="size-4 shrink-0 text-muted" />
      </button>
      {sheetOpen && (
        <WalletSheet items={sorted} selectedId={value?.walletId ?? null} onClose={() => setSheetOpen(false)}
          onPick={v => {
            declined.current = !v
            setNoVoucher(!v)
            onChange(v ? { walletId: v.id, label: v.title, discount: v.discount ?? 0 } : null)
            setSheetOpen(false)
          }} />
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

/** A voucher ticket drawn in SVG for the empty wallet. */
function EmptyVoucherArt() {
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-28" aria-hidden>
      <path d="M10 14a6 6 0 0 1 6-6h88a6 6 0 0 1 6 6v14a10 10 0 0 0 0 24v14a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6V52a10 10 0 0 0 0-24Z" fill="#e8f6ee" stroke="#9fd8b8" strokeWidth="2" />
      <path d="M42 12v56" stroke="#9fd8b8" strokeWidth="2" strokeDasharray="4 4" />
      <text x="26" y="45" textAnchor="middle" fontSize="16" fontWeight="800" fill="#00a551">%</text>
      <rect x="52" y="28" width="44" height="7" rx="3.5" fill="#c3e8d2" />
      <rect x="52" y="42" width="30" height="6" rx="3" fill="#dcf1e5" />
    </svg>
  )
}

function WalletSheet({ items, selectedId, onPick, onClose }: {
  items: WalletVoucher[]
  selectedId: number | null
  onPick: (v: WalletVoucher | null) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-ink/45 lg:items-center lg:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Ví voucher" onClick={e => e.stopPropagation()}
        className="flex max-h-[85vh] min-h-[50vh] w-full max-w-[480px] flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-raised lg:min-h-[420px] lg:rounded-[18px]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="m-0 text-base font-extrabold text-ink">Ví voucher ({items.length})</h3>
          <button type="button" aria-label="Đóng" onClick={onClose} className="-mr-2 grid size-11 cursor-pointer place-items-center border-0 bg-transparent text-muted hover:text-ink">
            <CloseIcon />
          </button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <EmptyVoucherArt />
            <p className="m-0 text-sm font-bold text-ink">Bạn chưa có voucher nào</p>
            <p className="m-0 text-xs text-muted">Voucher bạn nhận từ Hành trình, sự kiện hay nhập mã sẽ nằm ở đây.</p>
          </div>
        ) : (
          <ul className="m-0 flex flex-1 list-none flex-col gap-2 overflow-y-auto p-4" aria-label="Voucher trong ví">
            <li>
              <button type="button" aria-pressed={selectedId === null} onClick={() => onPick(null)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left font-[inherit] ${
                  selectedId === null ? 'border-green bg-green-soft' : 'border-line bg-white'
                }`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-bg text-muted"><CloseIcon /></span>
                <span className="min-w-0 flex-1 text-sm font-bold text-ink">Không dùng voucher</span>
                {selectedId === null && <span className="shrink-0 text-xs font-bold text-green-dark">Đang chọn</span>}
              </button>
            </li>
            {items.map(v => {
              const usable = !v.problem && (v.discount ?? 0) > 0
              const selected = selectedId === v.id
              const exp = expiryLabel(v.expiresAt)
              return (
                <li key={v.id}>
                  <button type="button" disabled={!usable} aria-pressed={selected} onClick={() => onPick(selected ? null : v)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left font-[inherit] ${
                      selected ? 'border-green bg-green-soft' : 'border-line bg-white'
                    } disabled:cursor-not-allowed disabled:opacity-60`}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-green text-xs font-extrabold text-white">
                      {v.kind === 'percent' ? `${Math.round(v.value)}%` : `${Math.round(v.value / 1000)}K`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">{v.title}</span>
                      <span className="block text-xs text-muted">{conditionLine(v)}{exp ? ` · ${exp}` : ''}</span>
                      {!usable && v.problem && <span className="block text-xs text-red">{v.problem}</span>}
                    </span>
                    {usable && <span className="shrink-0 text-right text-sm font-bold text-green-dark">−{formatVnd(v.discount ?? 0)}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <div className="border-t border-line px-5 py-3 text-center">
          <Link href="/account/vouchers" className="text-sm font-semibold text-green-dark no-underline">Xem ví voucher ›</Link>
        </div>
      </div>
    </div>
  )
}
