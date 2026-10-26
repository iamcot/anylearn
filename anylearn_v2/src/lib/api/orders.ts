import { apiFetch, authFetch } from './client'

export interface PendingOrder {
  orderId: string
  amount: number
  paymentMethod: string
  status: string
  createdAt?: string
  // When the system gives up on the order if it is still unpaid
  expiresAt?: string
  items: PendingOrderItem[]
}

export interface PendingOrderItem {
  itemId: number
  title: string
  image?: string
  // Who attends and which slot was chosen: used to spot a second order for the same course
  learnerId?: number | null
  scheduleId?: number | null
}

export async function getPendingOrders(token: string): Promise<PendingOrder[]> {
  const { data } = await authFetch<PendingOrder[]>('/payment/pending-orders', token)
  return data ?? []
}

export async function cancelOrder(orderId: string, token: string): Promise<{ error?: string }> {
  const { error } = await authFetch(`/order/${orderId}/cancel`, token, { method: 'POST' })
  return { error }
}

export interface BankInfo {
  bankName: string
  bankBin?: string
  accountNumber: string
  accountName: string
  transferContent: string
  zaloPhone: string
}

export async function getBankInfo(): Promise<BankInfo | null> {
  return apiFetch<BankInfo>('/payment/bank-info')
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface PaymentInitiateResult {
  redirectUrl?: string
  method?: string
  orderId?: string
}

export async function initiatePayment(
  orderId: string,
  token: string,
  paymentMethod?: string
): Promise<{ data: PaymentInitiateResult | null; error?: string }> {
  return authFetch<PaymentInitiateResult>('/payment/initiate', token, {
    method: 'POST',
    body: JSON.stringify({ orderId, ...(paymentMethod ? { paymentMethod } : {}) }),
  })
}
