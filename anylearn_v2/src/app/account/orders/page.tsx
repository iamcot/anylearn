'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getUserOrders, UserOrder, getCourseUrl } from '@/lib/api'
import OrderItemRating from '@/components/OrderItemRating'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

function formatPrice(p: number) {
  if (!p) return '0 đ'
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return p.toLocaleString('vi-VN') + ' đ'
}

const UNPAID_STATUSES = new Set(['new', 'pay_pending'])

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
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    getUserOrders(token).then(data => { setOrders(data); setLoading(false) })
  }, [token])

  async function handleCancel(orderId: string) {
    setCancellingId(orderId)
    try {
      await fetch(`${BASE}/order/${orderId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrders(prev => prev.map(o =>
        o.orderId === orderId ? { ...o, status: 'cancel_buyer' } : o
      ))
    } finally {
      setCancellingId(null)
      setConfirmId(null)
    }
  }

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
                  <div className="flex items-center gap-2 shrink-0">
                    {UNPAID_STATUSES.has(order.status) && (
                      <>
                        <Link href={`/order/${order.orderId}`}
                          className="text-xs font-bold text-white bg-[#00539b] px-3 py-1 rounded-full no-underline hover:opacity-90">
                          Thanh toán ngay
                        </Link>
                        {confirmId === order.orderId ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted">Xác nhận hủy?</span>
                            <button
                              onClick={() => handleCancel(order.orderId)}
                              disabled={cancellingId === order.orderId}
                              className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full border-0 cursor-pointer">
                              {cancellingId === order.orderId ? '...' : 'Hủy'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs text-muted px-2 py-0.5 rounded-full border border-line bg-white cursor-pointer">
                              Thôi
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(order.orderId)}
                            className="text-xs font-bold text-[#e73348] bg-white border border-[#e73348] px-3 py-1 rounded-full cursor-pointer hover:bg-red-50">
                            Hủy đơn
                          </button>
                        )}
                      </>
                    )}
                    <span className="text-xs font-mono text-muted">#{order.orderId}</span>
                  </div>
                </div>

                {/* All items — show directly, no expand */}
                <div className="flex flex-col gap-3">
                  {order.items.map(item => (
                    <div key={item.itemId}>
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <Link href={getCourseUrl({ id: item.itemId, title: item.title, type: 'class' })} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt={item.title} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                          </Link>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link href={getCourseUrl({ id: item.itemId, title: item.title, type: 'class' })} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-bold text-ink truncate block no-underline hover:underline">
                            {item.title}
                          </Link>
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
                      {order.status === 'delivered' && (
                        <OrderItemRating itemId={item.itemId} itemTitle={item.title} />
                      )}
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
