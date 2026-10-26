'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  clearPendingOrders, getPendingOrdersServerSnapshot, getPendingOrdersSnapshot, refreshPendingOrders, subscribePendingOrders,
} from './pendingOrdersStore'

// Orders waiting for payment, shared by the tab badge, the cards and the checks before a new order.
export function usePendingOrders() {
  const { token } = useAuth()
  const pathname = usePathname()
  const orders = useSyncExternalStore(subscribePendingOrders, getPendingOrdersSnapshot, getPendingOrdersServerSnapshot)

  useEffect(() => {
    if (token) refreshPendingOrders(token)
    else clearPendingOrders()
  }, [token, pathname])

  return orders
}
