'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getWalletCHistory, type WalletTransaction } from '@/lib/api'
import AccountCard from '@/components/account/AccountCard'
import Badge, { type BadgeTone } from '@/components/Badge'
import { ListSkeleton } from '@/components/PageSkeleton'
import { CoinIcon } from '@/components/icons'

const TYPE_LABELS: Record<string, string> = {
  commission:      'Điểm giới thiệu',
  commission_add:  'Cộng điểm bổ sung',
  activitybonus:   'Thưởng hoạt động',
  exchange:        'Đổi điểm',
  exchange_refund: 'Hoàn điểm',
}

const STATUS_CONFIG: Record<number, { label: string; tone: BadgeTone }> = {
  0:  { label: 'Đang chờ', tone: 'warning' },
  1:  { label: 'Đã nhận',  tone: 'success' },
  99: { label: 'Từ chối',  tone: 'danger' },
}

export default function AnypointPage() {
  const { user, token } = useAuth()
  const [history, setHistory] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getWalletCHistory(token).then(data => { setHistory(data); setLoading(false) })
  }, [token])

  const totalPending = history.filter(t => t.status === 0 && t.amount > 0).reduce((sum, t) => sum + t.amount, 0)

  return (
    <AccountCard title="anyPoint" subtitle="Điểm tích lũy từ các hoạt động trên anyLEARN">
      <div className="border-b border-line bg-gradient-to-r from-blue-soft to-green-soft px-5 py-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="mb-1 text-xs text-muted">Số dư hiện tại</div>
            <div className="flex items-center gap-2 text-3xl font-extrabold text-ink">
              <CoinIcon className="size-8 text-yellow" />
              {(user?.walletC ?? 0).toLocaleString()}
              <span className="ml-1 text-base font-bold text-muted">anyPoint</span>
            </div>
          </div>
          {totalPending > 0 && (
            <div>
              <div className="mb-1 text-xs text-muted">Đang chờ xác nhận</div>
              <div className="text-xl font-extrabold text-warn-text">+{totalPending.toLocaleString()} pts</div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-5"><ListSkeleton showTitle={false} /></div>
      ) : history.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted">Chưa có lịch sử điểm nào.</div>
      ) : (
        <div className="divide-y divide-line">
          {history.map(txn => {
            const status = STATUS_CONFIG[txn.status] ?? { label: `Status ${txn.status}`, tone: 'neutral' as BadgeTone }
            const positive = txn.amount >= 0
            return (
              <div key={txn.id} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <div className={`min-w-[64px] shrink-0 text-right text-base font-extrabold ${positive ? 'text-green-dark' : 'text-red'}`}>
                  {positive ? '+' : ''}{txn.amount.toLocaleString()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">{TYPE_LABELS[txn.type] ?? txn.type}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  {txn.content && <div className="truncate text-xs text-muted">{txn.content}</div>}
                </div>
                {txn.createdAt && (
                  <div className="shrink-0 text-right text-xs text-muted">
                    {new Date(txn.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    <div>{new Date(txn.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AccountCard>
  )
}
