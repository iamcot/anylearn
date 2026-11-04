'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AccountCard from '@/components/account/AccountCard'
import VoucherTicket from '@/components/vouchers/VoucherTicket'
import CollectVouchers from '@/components/vouchers/CollectVouchers'
import { addVoucherCode, getVoucherWallet, type VoucherState, type WalletVoucher } from '@/lib/api/vouchers'
import { conditionLine, expiresSoon, expiryLabel, walletTab } from '@/lib/vouchers/rules'

const TABS: { key: VoucherState; label: string }[] = [
  { key: 'active', label: 'Còn dùng' },
  { key: 'used', label: 'Đã dùng' },
  { key: 'expired', label: 'Hết hạn' },
]

/** Voucher wallet (plan 20): vouchers the system gave, the person collected or typed; used at checkout. */
export default function VoucherWalletPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<WalletVoucher[]>([])
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState<VoucherState>('active')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(() => {
    if (!token) return
    getVoucherWallet(token).then(res => { setItems(res.items); setLoaded(true) })
  }, [token])

  useEffect(() => { load() }, [load])

  const add = async () => {
    if (!token || !code.trim()) return
    setBusy(true)
    setMessage(null)
    const { data, error } = await addVoucherCode(code.trim(), token)
    setBusy(false)
    if (error || !data) { setMessage({ ok: false, text: error || 'Mã không hợp lệ' }); return }
    setMessage({ ok: true, text: `Đã thêm "${data.title}" vào ví` })
    setCode('')
    setTab('active')
    load()
  }

  const list = walletTab(items, tab)

  return (
    <div className="flex flex-col gap-4">
      <AccountCard title="Ví voucher" subtitle="Voucher được tặng hoặc bạn đã lưu. Chọn khi thanh toán để trừ vào đơn hàng.">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-4">
          <label htmlFor="voucher-code" className="text-sm font-bold text-ink">Có mã voucher? Thêm vào ví</label>
          <div className="flex gap-2">
            <input
              id="voucher-code"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') add() }}
              placeholder="Nhập mã"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-line px-3 font-[inherit] text-base uppercase"
            />
            <button type="button" onClick={add} disabled={busy || !code.trim()} className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 font-[inherit] text-sm font-black text-white hover:bg-green-dark disabled:bg-slate-200 disabled:text-muted">
              {busy ? '...' : 'Thêm'}
            </button>
          </div>
          {message && <p role="status" className={`m-0 text-xs font-bold ${message.ok ? 'text-green-dark' : 'text-warn-text'}`}>{message.text}</p>}
        </div>

        <div className="flex gap-1 border-b border-line px-3" role="tablist">
          {TABS.map(t => {
            const count = walletTab(items, t.key).length
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-11 cursor-pointer border-0 border-b-2 bg-transparent px-3 font-[inherit] text-sm font-bold ${tab === t.key ? 'border-green text-green-dark' : 'border-transparent text-muted'}`}
              >
                {t.label}{count > 0 ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 px-5 py-4">
          {loaded && list.length === 0 && (
            <p className="m-0 py-4 text-center text-sm text-muted">
              {tab === 'active' ? 'Ví chưa có voucher. Lưu voucher bên dưới hoặc nhận khi hoàn thành nhiệm vụ.' : 'Chưa có voucher nào ở đây.'}
            </p>
          )}
          {list.map(v => {
            const soon = tab === 'active' && expiresSoon(v.expiresAt)
            const note = tab === 'used'
              ? (v.usedOrderId ? `Đã dùng cho đơn #${v.usedOrderId}` : 'Đã dùng')
              : expiryLabel(v.expiresAt)
            return (
              <VoucherTicket
                key={v.id}
                value={v.value}
                kind={v.kind}
                title={v.title}
                condition={conditionLine(v)}
                note={soon ? `Sắp hết hạn · ${note}` : note}
                warn={soon}
                dim={tab !== 'active'}
                action={tab === 'used' && v.usedOrderId
                  ? <Link href={`/order/${v.usedOrderId}`} className="shrink-0 text-xs font-bold text-green-dark">Xem đơn</Link>
                  : <code className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-ink">{v.code}</code>}
              />
            )
          })}
        </div>
      </AccountCard>

      <CollectVouchers place="tier" title="Voucher đang phát" />
    </div>
  )
}
