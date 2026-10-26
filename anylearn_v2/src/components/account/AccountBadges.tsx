'use client'

import { usePendingOrders } from '@/components/orders/usePendingOrders'

// Red number next to "Đơn hàng của tôi" while orders wait for payment.
export function PendingOrdersPill() {
  const count = usePendingOrders().length
  if (count === 0) return null
  return <span className="rounded-full bg-red px-2 py-0.5 text-xs font-extrabold text-white">{count}</span>
}

export function PointBadge({ points, active }: { points: number; active: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${active ? 'bg-green text-white' : 'bg-yellow/20 text-ink'}`}>
      {points.toLocaleString()}
    </span>
  )
}
