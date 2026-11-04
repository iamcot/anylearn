import { API_BASE } from '@/lib/apiBase'
import { authFetch } from './client'

// Voucher wallet (plan 20). The server checks every voucher again at checkout and lowers the order amount.

export type VoucherState = 'active' | 'used' | 'expired'
export type VoucherKind = 'money' | 'percent'

export interface WalletVoucher {
  id: number
  code: string
  title: string
  // money: `value` VND off; percent: `value` % off the covered lines, at most `maxDiscount` VND (0 = no cap)
  kind?: VoucherKind
  value: number
  maxDiscount?: number
  minOrder: number
  itemIds: number[]
  partnerId?: number | null
  partnerName?: string | null
  source: string
  state: VoucherState
  expiresAt?: string | null
  usedOrderId?: number | null
  receivedAt?: string | null
  // Only in the checkout list: what it takes off the current cart, or why it cannot be used.
  discount?: number
  problem?: string | null
}

export interface CollectibleVoucher {
  groupId: number
  title: string
  kind?: VoucherKind
  value: number
  maxDiscount?: number
  minOrder: number
  itemIds: number[]
  partnerId?: number | null
  partnerName?: string | null
  left?: number | null
  walletDays?: number | null
  collected: boolean
}

export interface VoucherQuote {
  code: string
  walletId?: number | null
  title?: string
  discountValue: number
  message: string
}

export type VoucherPlace = 'home' | 'search' | 'pdp' | 'partner' | 'fun' | 'tier'

export async function getVoucherWallet(token: string): Promise<{ items: WalletVoucher[]; active: number }> {
  const { data } = await authFetch<{ items: WalletVoucher[]; active: number }>('/vouchers/wallet', token)
  return data ?? { items: [], active: 0 }
}

export async function getVouchersForCart(token: string): Promise<WalletVoucher[]> {
  const { data } = await authFetch<{ items: WalletVoucher[] }>('/vouchers/for-cart', token)
  return data?.items ?? []
}

export async function quoteVoucher(code: string, token: string) {
  return authFetch<VoucherQuote>(`/vouchers/quote?code=${encodeURIComponent(code)}`, token)
}

export async function addVoucherCode(code: string, token: string) {
  return authFetch<{ id: number; title: string; code: string }>('/vouchers/add', token, { method: 'POST', body: JSON.stringify({ code }) })
}

export async function collectVoucher(groupId: number, token: string) {
  return authFetch<{ id: number; title: string }>('/vouchers/collect', token, { method: 'POST', body: JSON.stringify({ groupId }) })
}

export async function getCollectibleVouchers(
  opts: { place: VoucherPlace; partnerId?: number; itemId?: number },
  token?: string | null,
): Promise<CollectibleVoucher[]> {
  const q = new URLSearchParams({ place: opts.place })
  if (opts.partnerId) q.set('partnerId', String(opts.partnerId))
  if (opts.itemId) q.set('itemId', String(opts.itemId))
  try {
    const res = await fetch(`${API_BASE}/vouchers/collectible?${q}`, {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const json = await res.json()
    return Array.isArray(json?.data) ? json.data : []
  } catch {
    return []
  }
}
