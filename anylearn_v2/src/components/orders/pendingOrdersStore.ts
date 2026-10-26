import { getPendingOrders, type PendingOrder } from '@/lib/api/orders'

const REFRESH_AFTER_MS = 60_000

let orders: PendingOrder[] = []
let loadedFor: string | null = null
let loadedAt = 0
let loading = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(listener => listener())
}

export function subscribePendingOrders(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const getPendingOrdersSnapshot = () => orders
const NO_ORDERS: PendingOrder[] = []
export const getPendingOrdersServerSnapshot = () => NO_ORDERS

// Fetches at most once a minute per login; `force` is for after the person pays or cancels something.
export async function refreshPendingOrders(token: string, force = false) {
  const fresh = loadedFor === token && Date.now() - loadedAt < REFRESH_AFTER_MS
  if (loading || (fresh && !force)) return
  loading = true
  const next = await getPendingOrders(token)
  loading = false
  loadedFor = token
  loadedAt = Date.now()
  orders = next
  emit()
}

export function clearPendingOrders() {
  if (orders.length === 0 && loadedFor === null) return
  orders = []
  loadedFor = null
  loadedAt = 0
  emit()
}
