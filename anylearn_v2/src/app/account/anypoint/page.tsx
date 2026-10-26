'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getWalletCHistory, type WalletTransaction } from '@/lib/api'
import AccountCard from '@/components/account/AccountCard'
import Badge, { type BadgeTone } from '@/components/Badge'
import { ListSkeleton } from '@/components/PageSkeleton'
import { CoinIcon } from '@/components/icons'
import HowToEarn from '@/components/points/HowToEarn'
import { formatPoints } from '@/lib/points/reward'
import { POINT_VALUE_VND } from '@/config/points'
import { formatExactPrice } from '@/lib/format/price'
import { describeTransaction, sumPendingPoints, type HistoryTone } from '@/lib/points/history'
import Link from 'next/link'

const AMOUNT_CLASS: Record<HistoryTone, string> = { earn: 'text-green-dark', spend: 'text-red', neutral: 'text-ink' }

const STATUS_CONFIG: Record<number, { label: string; tone: BadgeTone }> = {
  0:  { label: 'Đang chờ', tone: 'warning' },
  1:  { label: 'Đã nhận',  tone: 'success' },
  99: { label: 'Từ chối',  tone: 'danger' },
}

export default function AnypointPage() {
  const { user, token, refreshUser } = useAuth()
  const [history, setHistory] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getWalletCHistory(token).then(data => { setHistory(data); setLoading(false) })
    refreshUser()
  }, [token, refreshUser])

  const totalPending = sumPendingPoints(history)
  const balance = user?.walletC ?? 0

  return (
    <AccountCard title="anyPoint" subtitle="anyPoint tích lũy từ các hoạt động trên anyLEARN">
      <div className="border-b border-line bg-gradient-to-r from-blue-soft to-green-soft px-5 py-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="mb-1 text-xs text-muted">Số dư hiện tại</div>
            <div className="flex items-center gap-2 text-3xl font-extrabold text-ink">
              <CoinIcon className="size-8 text-yellow" />
              {formatPoints(balance)}
              <span className="ml-1 text-base font-bold text-muted">anyPoint</span>
            </div>
            <div className="mt-1 text-sm text-muted">~ {formatExactPrice(balance * POINT_VALUE_VND)} giảm cho khóa học tiếp theo</div>
          </div>
          {totalPending > 0 && (
            <div>
              <div className="mb-1 text-xs text-muted">Đang chờ xác nhận</div>
              <div className="text-xl font-extrabold text-warn-text">+{formatPoints(totalPending)} anyPoint</div>
            </div>
          )}
        </div>
      </div>

      <h3 className="m-0 border-b border-line bg-bg px-5 py-2.5 text-sm font-extrabold text-ink">Lịch sử anyPoint</h3>

      {loading ? (
        <div className="p-5"><ListSkeleton showTitle={false} /></div>
      ) : history.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted">Chưa có lịch sử anyPoint nào.</div>
      ) : (
        <div className="divide-y divide-line">
          {history.map(txn => {
            const status = STATUS_CONFIG[txn.status] ?? { label: `Status ${txn.status}`, tone: 'neutral' as BadgeTone }
            const positive = txn.amount >= 0
            const reason = describeTransaction(txn)
            return (
              <div key={txn.id} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <div className={`min-w-[64px] shrink-0 text-right text-base font-extrabold ${AMOUNT_CLASS[reason.tone]}`}>
                  {positive ? '+' : ''}{formatPoints(txn.amount)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">{reason.title}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  {txn.content && <div className="text-xs text-muted">{txn.content}</div>}
                  {txn.orderId && (
                    <Link href={`/order/${txn.orderId}`} className="text-xs font-medium text-green-dark">Xem đơn #{txn.orderId}</Link>
                  )}
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

      <div className="border-t border-line px-4 py-5 sm:px-5">
        <HowToEarn />
        <Link href="/info/anypoint" className="mt-3 inline-block text-xs font-medium text-green-dark">anyPoint là gì?</Link>
      </div>

    </AccountCard>
  )
}
