export type OrderTab = 'pending' | 'completed' | 'cancelled'

export const ORDER_TABS: { key: OrderTab; label: string }[] = [
  { key: 'pending', label: 'Chờ thanh toán' },
  { key: 'completed', label: 'Đã thanh toán' },
  { key: 'cancelled', label: 'Đã hủy' },
]

const PENDING_STATUSES = new Set(['new', 'pay_pending'])
const COMPLETED_STATUSES = new Set(['paid', 'delivered'])

export function orderTab(status: string): OrderTab {
  if (PENDING_STATUSES.has(status)) return 'pending'
  if (COMPLETED_STATUSES.has(status)) return 'completed'
  return 'cancelled'
}

export function parseOrderTab(value: string | null): OrderTab | null {
  return ORDER_TABS.find(tab => tab.key === value)?.key ?? null
}

// The tab to open first: the one from the link, else "pending" when something waits for payment, else "paid".
export function defaultOrderTab(requested: string | null, statuses: string[]): OrderTab {
  const fromLink = parseOrderTab(requested)
  if (fromLink) return fromLink
  return statuses.some(status => orderTab(status) === 'pending') ? 'pending' : 'completed'
}
