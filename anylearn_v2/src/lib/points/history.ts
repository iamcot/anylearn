export interface WalletTransactionLike {
  type: string
  amount: number
  status: number
  orderId?: number | null
}

export type HistoryTone = 'earn' | 'spend' | 'neutral'

export interface HistoryReason {
  title: string
  tone: HistoryTone
}

const FIXED_REASONS: Record<string, string> = {
  commission_add: 'Cộng điểm bổ sung',
  activitybonus: 'Thưởng hoạt động',
}

// The wallet history mixes the reward for the account's own purchase (it has an order) and referral rewards (it does not).
export function describeTransaction(txn: WalletTransactionLike): HistoryReason {
  const orderSuffix = txn.orderId ? ` #${txn.orderId}` : ''
  if (txn.type === 'commission') {
    return txn.orderId
      ? { title: `Điểm từ đơn${orderSuffix}`, tone: 'earn' }
      : { title: 'Điểm giới thiệu bạn bè', tone: 'earn' }
  }
  if (txn.type === 'exchange') return { title: `Dùng điểm cho đơn${orderSuffix}`, tone: 'spend' }
  if (txn.type === 'exchange_refund') return { title: `Hoàn điểm đơn${orderSuffix}`, tone: 'earn' }
  return { title: FIXED_REASONS[txn.type] ?? 'Thay đổi điểm', tone: txn.amount < 0 ? 'spend' : 'neutral' }
}

export function sumPendingPoints(history: WalletTransactionLike[]): number {
  return history.filter(txn => txn.status === 0 && txn.amount > 0).reduce((sum, txn) => sum + txn.amount, 0)
}
