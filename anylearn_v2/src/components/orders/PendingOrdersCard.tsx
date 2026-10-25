'use client'

import Link from 'next/link'
import { ClockIcon } from '@/components/icons'
import { formatHoldUntil } from '@/lib/orders/deadline'
import { usePendingOrders } from './usePendingOrders'

// "Bạn có 2 đơn chờ thanh toán": one order goes straight to its payment page, several go to the waiting tab.
export default function PendingOrdersCard() {
  const orders = usePendingOrders()
  if (orders.length === 0) return null

  const single = orders.length === 1 ? orders[0] : undefined
  const href = single ? `/order/${single.orderId}` : '/account/orders?tab=pending'
  const holdUntil = formatHoldUntil(single?.expiresAt)

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-card border border-warn-line bg-warn-soft p-4 text-left">
      <ClockIcon className="size-6 shrink-0 text-warn-text" />
      <div className="min-w-[180px] flex-1">
        <h2 className="m-0 text-base font-medium text-ink">Bạn có {orders.length} đơn chờ thanh toán</h2>
        <p className="m-0 mt-0.5 text-sm text-muted">
          {holdUntil ? `anyLEARN giữ chỗ đến ${holdUntil}.` : 'Hoàn tất thanh toán để giữ chỗ cho bé.'}
        </p>
      </div>
      <Link href={href} className="btn btn--green min-h-11 px-5 py-2 text-sm no-underline">
        {single ? 'Thanh toán ngay' : 'Xem đơn chờ'}
      </Link>
    </section>
  )
}
