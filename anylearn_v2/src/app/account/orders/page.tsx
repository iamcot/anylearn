'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getUserOrders, UserOrder } from '@/lib/api'

function formatPrice(p: number) {
  if (!p) return '0 đ'
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return p.toLocaleString('vi-VN') + ' đ'
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  new:           { label: 'Mới',           cls: 'bg-bg text-muted' },
  pay_pending:   { label: 'Chờ thanh toán', cls: 'bg-warn-soft text-warn-text' },
  delivered:     { label: 'Hoàn thành',     cls: 'bg-green-soft text-green-dark' },
  cancel_buyer:  { label: 'Đã hủy',         cls: 'bg-red-soft text-red' },
  cancel_system: { label: 'Đã hủy',         cls: 'bg-red-soft text-red' },
  refund:        { label: 'Hoàn tiền',      cls: 'bg-blue-soft text-blue' },
}

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Chuyển khoản',
  card:          'Thẻ OnePay',
  vnpay:         'VNPay QR',
  momo:          'Ví MoMo',
  installment:   'Trả góp',
}

export default function OrdersPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getUserOrders(token).then(data => { setOrders(data); setLoading(false) })
  }, [token])

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="m-0 text-lg font-black text-ink">Đơn hàng của tôi</h2>
      </div>

      {loading ? (
        <div className="p-5 text-muted text-sm">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center text-muted text-sm">Chưa có đơn hàng nào.</div>
      ) : (
        <div className="divide-y divide-line">
          {orders.map(order => {
            const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, cls: 'bg-bg text-muted' }
            const paymentLabel = PAYMENT_LABELS[order.payment] ?? order.payment

            return (
              <div key={order.orderId} className="px-5 py-4">

                {/* Metadata row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.createdAt && (
                      <span className="text-xs text-muted">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    )}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted shrink-0">#{order.orderId}</span>
                </div>

                {/* All items — show directly, no expand */}
                <div className="flex flex-col gap-2">
                  {order.items.map(item => (
                    <div key={item.itemId} className="flex items-center gap-3">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.title} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-ink truncate">{item.title}</div>
                        {item.studentName && (
                          <div className="text-xs text-muted">Học sinh: {item.studentName}</div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-black text-red text-base">{formatPrice(item.paidPrice)}</div>
                        {order.items.indexOf(item) === 0 && (
                          <div className="text-xs text-muted">{paymentLabel}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
