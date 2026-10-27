import { API_BASE } from '@/lib/apiBase'
import { authFetch } from './client'

export interface UserProfile {
  id: number
  name: string
  firstName?: string
  phone: string
  email?: string
  role: string
  image?: string
  banner?: string
  introduce?: string
  fullContent?: string
  title?: string
  address?: string
  dob?: string
  dobYearOnly?: boolean
  sex?: string
  walletM?: number
  walletC?: number
  apiToken: string
}

export interface ChildUser {
  id: number
  name: string
  phone: string
  image?: string
  dob?: string
  dobYearOnly?: boolean
}

export interface UserOrder {
  orderId: string
  amount: number
  status: string
  payment: string
  createdAt: string
  items: { itemId: number; title: string; image?: string; paidPrice: number; studentName?: string; learnerId?: number }[]
}

export interface ItemCode {
  codeId: number
  code: string
  itemId: number
  itemTitle: string
  itemImage?: string
  subtype?: string
  createdAt: string
}

export async function updateProfile(
  data: Partial<Omit<UserProfile, 'id' | 'phone' | 'apiToken'>>,
  token: string
): Promise<{ data: UserProfile | null; error?: string }> {
  return authFetch<UserProfile>('/user/edit', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getMyProfile(token: string): Promise<UserProfile | null> {
  const { data } = await authFetch<{ user: UserProfile }>('/user', token)
  return data?.user ?? null
}

export async function changePassword(
  oldPass: string,
  newPass: string,
  token: string
): Promise<{ error?: string }> {
  const { error } = await authFetch('/user/changepass', token, {
    method: 'POST',
    body: JSON.stringify({ oldPass, newPass }),
  })
  return { error }
}

export async function getChildren(token: string): Promise<ChildUser[]> {
  const { data } = await authFetch<ChildUser[]>('/user/children', token)
  return data ?? []
}

export async function saveChild(
  data: { id?: number; name: string; dob?: string; dobYearOnly?: boolean },
  token: string
): Promise<{ data: ChildUser | null; error?: string }> {
  return authFetch<ChildUser>('/user/children', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface ChildInterests {
  likes: string[]
  wants: string[]
  budget: string | null
  // True once saved, even when every question was skipped (the app then stops asking).
  answered?: boolean
}

export async function getChildInterests(childId: number, token: string): Promise<ChildInterests | null> {
  const { data } = await authFetch<ChildInterests>(`/user/children/${childId}/interests`, token)
  return data ?? null
}

export async function saveChildInterests(childId: number, answers: ChildInterests, token: string): Promise<{ error?: string }> {
  const { error } = await authFetch(`/user/children/${childId}/interests`, token, { method: 'PUT', body: JSON.stringify(answers) })
  return { error }
}

// The same survey for the account owner.
export async function getMyInterests(token: string): Promise<ChildInterests | null> {
  const { data } = await authFetch<ChildInterests>('/user/interests', token)
  return data ?? null
}

export async function saveMyInterests(answers: ChildInterests, token: string): Promise<{ error?: string }> {
  const { error } = await authFetch('/user/interests', token, { method: 'PUT', body: JSON.stringify(answers) })
  return { error }
}

export async function deleteChild(
  childId: number,
  token: string
): Promise<{ error?: string }> {
  const { error } = await authFetch(`/user/children/${childId}`, token, { method: 'DELETE' })
  return { error }
}

export async function getUserOrders(token: string): Promise<UserOrder[]> {
  const { data } = await authFetch<UserOrder[]>('/user/orders', token)
  return data ?? []
}

export async function getUserItemCodes(token: string): Promise<ItemCode[]> {
  const { data } = await authFetch<ItemCode[]>('/user/item-codes', token)
  return data ?? []
}

export interface WalletTransaction {
  id: number
  type: string
  amount: number
  status: number
  content?: string
  createdAt: string
  // Order this movement belongs to (own purchases, spent and refunded points); referral rewards have none
  orderId?: number | null
}

export async function getWalletCHistory(token: string): Promise<WalletTransaction[]> {
  const { data } = await authFetch<WalletTransaction[]>('/user/wallet-c-history', token)
  return data ?? []
}

export interface VoucherResult {
  code: string
  type: string
  discountValue: number
  message: string
}

export async function checkVoucher(code: string, orderAmount: number): Promise<{ data: VoucherResult | null; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/voucher/check?code=${encodeURIComponent(code)}&orderAmount=${orderAmount}`, { cache: 'no-store' })
    const json = await res.json()
    if (json?.resultCode === 0) return { data: null, error: json?.message || 'Mã không hợp lệ' }
    return { data: json?.data ?? null }
  } catch {
    return { data: null, error: 'Không thể kết nối máy chủ' }
  }
}

export async function updateImageUrl(
  type: string,
  imageUrl: string,
  token: string
): Promise<{ data: UserProfile | null; error?: string }> {
  return authFetch<UserProfile>(`/user/upload-image/${type}`, token, {
    method: 'POST',
    body: JSON.stringify({ imageUrl }),
  })
}

// The member's saved home address, where "near me" starts when the browser gives no position. Null when none is saved.
export async function getHomePoint(token: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const { data } = await authFetch<{ lat: number; lng: number; label: string } | null>('/user/home-point', token)
  return data ?? null
}
