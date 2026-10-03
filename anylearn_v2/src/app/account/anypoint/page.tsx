'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getWalletCHistory, WalletTransaction } from '@/lib/api'

const TYPE_LABELS: Record<string, string> = {
  commission:     'Điểm giới thiệu',
  commission_add: 'Cộng điểm bổ sung',
  activitybonus:  'Thưởng hoạt động',
  exchange:       'Đổi điểm',
}

const STATUS_CONFIG: Record<number, { label: string; cls: string }> = {
  0:  { label: 'Đang chờ',  cls: 'bg-warn-soft text-warn-text' },
  1:  { label: 'Đã nhận',   cls: 'bg-green-soft text-green-dark' },
  99: { label: 'Từ chối',   cls: 'bg-red-soft text-red' },
}

export default function AnypointPage() {
  const { user, token } = useAuth()
  const [history, setHistory] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getWalletCHistory(token).then(data => { setHistory(data); setLoading(false) })
  }, [token])

  const totalPending = history
    .filter(t => t.status === 0 && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-line px-5 py-4">
        <h2 className="m-0 text-lg font-black text-ink">anyPoint</h2>
        <p className="m-0 mt-1 text-xs text-muted">Điểm tích lũy từ các hoạt động trên anyLEARN</p>
      </div>

      {/* Balance */}
      <div className="px-5 py-5 border-b border-line bg-gradient-to-r from-blue-soft to-green-soft">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <div className="text-xs text-muted mb-1">Số dư hiện tại</div>
            <div className="text-3xl font-black text-ink">
              🟡 {(user?.walletC ?? 0).toLocaleString()}
              <span className="text-base font-bold text-muted ml-1">pts</span>
            </div>
          </div>
          {totalPending > 0 && (
            <div>
              <div className="text-xs text-muted mb-1">Đang chờ xác nhận</div>
              <div className="text-xl font-black text-warn-text">
                +{totalPending.toLocaleString()} pts
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {loading ? (
        <div className="p-5 text-muted text-sm">Đang tải...</div>
      ) : history.length === 0 ? (
        <div className="p-10 text-center text-muted text-sm">Chưa có lịch sử điểm nào.</div>
      ) : (
        <div className="divide-y divide-line">
          {history.map(txn => {
            const statusInfo = STATUS_CONFIG[txn.status] ?? { label: `Status ${txn.status}`, cls: 'bg-bg text-muted' }
            const isPositive = txn.amount >= 0
            return (
              <div key={txn.id} className="px-5 py-4 flex items-center gap-3">
                {/* Amount */}
                <div className={`text-base font-black shrink-0 min-w-[70px] text-right
                  ${isPositive ? 'text-green-dark' : 'text-red'}`}>
                  {isPositive ? '+' : ''}{txn.amount.toLocaleString()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-ink">
                      {TYPE_LABELS[txn.type] ?? txn.type}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {txn.content && (
                    <div className="text-xs text-muted truncate">{txn.content}</div>
                  )}
                </div>

                {/* Time — right side */}
                {txn.createdAt && (
                  <div className="text-xs text-muted shrink-0 text-right">
                    {new Date(txn.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    <div>{new Date(txn.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
