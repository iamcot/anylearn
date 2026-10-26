import { Item } from './catalog'
import { authFetch } from './client'

export interface ItemSchedule {
  id: number; title?: string; scheduleType: string
  weekdays?: string; timeStart?: string; timeEnd?: string
  dateStart?: string; dateEnd?: string; eventDate?: string
  durationValue?: number; durationUnit?: string; locationNote?: string
}

// ── Cart ──────────────────────────────────────────────
export interface CartInfoData {
  item: Item & { orgPrice?: number; nolimitTime?: string; authorName?: string; cycleType?: string; cycleAmount?: number }
  children: { id: number; name: string; image?: string; dob?: string; dobYearOnly?: boolean }[]
  plans: { id: number; title?: string; weekdays?: string; date_start?: string; time_start?: string; location_title?: string; address?: string }[]
  schedules: ItemSchedule[]
  categories: { id: number; title: string; url: string }[]
  activiyTrial: boolean
  activiyTest: boolean
  activiyVisit: boolean
}

export interface CartItem {
  cartItemId: number
  itemId: number
  title: string
  image?: string
  price: number
  orgPrice?: number
  // anyPoints the buyer earns for this line once the order is approved
  points?: number
  dateStart?: string
  authorName?: string
  studentName?: string
  // Who attends: a child (studentId) or the account itself (null). dobComplete is false while only a birth year is known.
  studentId?: number | null
  learnerId?: number
  learnerName?: string
  dobComplete?: boolean
  learnerDobYear?: number | null
  scheduleTitle?: string
  scheduleTime?: string
  activities?: { type: string; date?: string; note?: string }[]
  extra?: Record<string, unknown>
}

export interface OrderData {
  orderId: string
  items: { itemId: number; title: string; price: number; image?: string; seoUrl?: string; studentName?: string; scheduleTitle?: string; scheduleTime?: string; activities?: { type: string; date?: string; note?: string }[] }[]
  paymentMethod: string
  status?: string
  amount?: number
  transferNote?: string
  // anyPoints credited to the buyer for this order
  pointsEarned?: number
  // When the order is cancelled if it is still unpaid (only while it waits for payment)
  expiresAt?: string
}

export async function getCartInfo(itemId: number, token: string): Promise<CartInfoData | null> {
  const { data } = await authFetch<CartInfoData>(`/cart-info/${itemId}`, token)
  return data
}

export async function addToCart(payload: {
  itemId: number; studentId?: number; planId?: number; scheduleId?: number
  activities?: { type: string; date?: string; note?: string }[]
  startDate?: string
}, token: string): Promise<{ data: { cartItemId: number; cartCount: number } | null; error?: string }> {
  return authFetch(`/cart/add`, token, { method: 'POST', body: JSON.stringify(payload) })
}

export async function getCart(token: string): Promise<CartItem[]> {
  const { data } = await authFetch<CartItem[]>(`/cart`, token)
  return data ?? []
}

export async function removeCartItem(actionId: number, token: string): Promise<void> {
  await authFetch(`/cart/${actionId}`, token, { method: 'DELETE' })
}

export interface UpcomingEvent {
  date: string
  kind: 'enrollment' | 'activity'
  label: string
  itemTitle: string
  seoUrl?: string
  itemId?: number
  time?: string
}

export async function getUpcomingEvents(token: string): Promise<UpcomingEvent[]> {
  const { data } = await authFetch<UpcomingEvent[]>(`/user/upcoming`, token)
  return data ?? []
}

export async function checkout(payload: {
  paymentMethod: string; couponCode?: string; pointsUsed?: number
}, token: string): Promise<{ data: OrderData | null; error?: string }> {
  return authFetch(`/checkout`, token, { method: 'POST', body: JSON.stringify(payload) })
}

export async function getOrder(orderId: string, token: string): Promise<OrderData | null> {
  const { data } = await authFetch<OrderData>(`/order/${orderId}`, token)
  return data
}
