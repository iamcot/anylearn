import type { PendingOrder } from '@/lib/api/orders'

export interface OrderLineKey {
  itemId: number
  learnerId?: number | null
  scheduleId?: number | null
}

const sameOptional = (left?: number | null, right?: number | null) => (left ?? null) === (right ?? null)

// An unpaid order for the same course, the same learner and the same slot: the buyer probably forgot it.
export function findDuplicatePendingOrder(pendingOrders: PendingOrder[], line: OrderLineKey): PendingOrder | null {
  return pendingOrders.find(order => order.items.some(item =>
    item.itemId === line.itemId
    && sameOptional(item.learnerId, line.learnerId)
    && sameOptional(item.scheduleId, line.scheduleId),
  )) ?? null
}

export function findDuplicateForCart(
  pendingOrders: PendingOrder[],
  cartLines: { itemId: number; learnerId?: number | null; extra?: Record<string, unknown> }[],
): PendingOrder | null {
  for (const line of cartLines) {
    const scheduleId = typeof line.extra?.scheduleId === 'number' ? line.extra.scheduleId : Number(line.extra?.scheduleId) || null
    const duplicate = findDuplicatePendingOrder(pendingOrders, { itemId: line.itemId, learnerId: line.learnerId, scheduleId })
    if (duplicate) return duplicate
  }
  return null
}
