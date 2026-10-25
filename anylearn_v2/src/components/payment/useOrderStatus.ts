'use client'

import { useEffect, useState } from 'react'
import { getOrder } from '@/lib/api'
import { ORDER_STATUS_POLL_MS } from '@/config/payment'

// Polls the order while it waits for a bank transfer; returns the latest status (e.g. 'pay_pending', 'delivered')
export function useOrderStatus(orderId: string, token: string | null, initialStatus: string | undefined, active: boolean) {
  const [status, setStatus] = useState(initialStatus)

  useEffect(() => {
    if (!active || !token) return
    const timer = setInterval(async () => {
      if (document.hidden) return
      const order = await getOrder(orderId, token)
      if (order?.status) setStatus(order.status)
    }, ORDER_STATUS_POLL_MS)
    return () => clearInterval(timer)
  }, [orderId, token, active])

  return status
}
