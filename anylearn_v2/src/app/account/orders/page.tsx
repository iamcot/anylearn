'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getUserOrders, cancelOrder, getCourseUrl, type UserOrder } from '@/lib/api'
import OrderItemRating from '@/components/OrderItemRating'
import AccountCard from '@/components/account/AccountCard'
import Badge, { type BadgeTone } from '@/components/Badge'
import { formatPrice } from '@/lib/format/price'
import { formatDate } from '@/lib/format/date'
import { ListSkeleton } from '@/components/PageSkeleton'
import { useToast } from '@/components/ToastProvider'

const UNPAID_STATUSES = new Set(['new', 'pay_pending'])

const STATUS_LABELS: Record<string, { label: string; tone: BadgeTone }> = {
  new:           { label: 'Mới',            tone: 'neutral' },
  pay_pending:   { label: 'Chờ thanh toán', tone: 'warning' },
  delivered:     { label: 'Hoàn thành',     tone: 'success' },
  cancel_buyer:  { label: 'Đã hủy',         tone: 'danger' },
  cancel_system: { label: 'Đã hủy',         tone: 'danger' },
  refund:        { label: 'Hoàn tiền',      tone: 'info' },
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
  const toast = useToast()
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    getUserOrders(token).then(data => { setOrders(data); setLoading(false) })
  }, [token])

  async function handleCancel(orderId: string) {
    if (!token) return
    setCancellingId(orderId)
    const { error } = await cancelOrder(orderId, token)
    if (error) toast({ kind: 'error', text: error })
    else setOrders(prev => prev.map(order => (order.orderId === orderId ? { ...order, status: 'cancel_buyer' } : order)))
    setCancellingId(null)
    setConfirmId(null)
  }

  return (
    <AccountCard title="Đơn hàng của tôi">
      {loading ? (
        <div className="p-5"><ListSkeleton showTitle={false} /></div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted">Chưa có đơn hàng nào.</div>
      ) : (
        <div className="divide-y divide-line">
          {orders.map(order => {
            const status = STATUS_LABELS[order.status] ?? { label: order.status, tone: 'neutral' as BadgeTone }
            const paymentLabel = PAYMENT_LABELS[order.payment] ?? order.payment

            return (
              <div key={order.orderId} className="px-4 py-4 sm:px-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {order.createdAt && <span className="text-xs text-muted">{formatDate(order.createdAt)}</span>}
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <span className="font-mono text-xs text-muted">#{order.orderId}</span>
                  </div>

                  {UNPAID_STATUSES.has(order.status) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/order/${order.orderId}`} className="inline-flex min-h-11 items-center rounded-full bg-blue px-4 text-xs font-bold text-white no-underline hover:opacity-90">
                        Thanh toán ngay
                      </Link>
                      {confirmId === order.orderId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted">Xác nhận hủy?</span>
                          <button type="button" onClick={() => handleCancel(order.orderId)} disabled={cancellingId === order.orderId}
                            className="min-h-11 cursor-pointer rounded-full border-0 bg-red px-4 text-xs font-bold text-white">
                            {cancellingId === order.orderId ? '...' : 'Hủy'}
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)}
                            className="min-h-11 cursor-pointer rounded-full border border-line bg-white px-4 text-xs text-muted">
                            Thôi
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmId(order.orderId)}
                          className="min-h-11 cursor-pointer rounded-full border border-red bg-white px-4 text-xs font-bold text-red hover:bg-red-soft">
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {order.items.map((item, index) => (
                    <div key={item.itemId}>
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <Link href={getCourseUrl({ id: item.itemId, title: item.title })} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt="" loading="lazy" className="size-11 rounded-lg object-cover" />
                          </Link>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link href={getCourseUrl({ id: item.itemId, title: item.title })} target="_blank" rel="noopener noreferrer"
                            className="line-clamp-2 block text-sm font-bold text-ink no-underline hover:underline">
                            {item.title}
                          </Link>
                          {item.studentName && <div className="text-xs text-muted">Học sinh: {item.studentName}</div>}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-base font-extrabold text-red">{formatPrice(item.paidPrice, '0 đ')}</div>
                          {index === 0 && <div className="text-xs text-muted">{paymentLabel}</div>}
                        </div>
                      </div>
                      {order.status === 'delivered' && <OrderItemRating itemId={item.itemId} />}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AccountCard>
  )
}
