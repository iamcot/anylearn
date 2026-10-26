import { authFetch } from './client'

export interface AccountTodo { kind: string; label: string; route: string; count: number }
export interface SummaryChild { id: number; name: string; dobComplete: boolean; activeCourses: number }
export interface MeSummary {
  pendingOrders: number
  unreadNotifications: number
  children: SummaryChild[]
  todos: AccountTodo[]
  walletC: number
}

export interface MeChildCourse { itemId: number; title: string; status: string; startDate?: string | null; endDate?: string | null; orderId?: number | null }
export interface MeChild {
  id: number
  name: string
  image?: string | null
  dob?: string | null
  dobYearOnly: boolean
  courses: MeChildCourse[]
  orderCount: number
}

export async function getMeSummary(token: string): Promise<MeSummary | null> {
  const { data } = await authFetch<MeSummary>('/me/summary', token)
  return data ?? null
}

export async function getMeChild(childId: number, token: string): Promise<MeChild | null> {
  const { data } = await authFetch<MeChild>(`/me/children/${childId}`, token)
  return data ?? null
}

// topic -> channel -> on/off; everything is on until the person switches it off
export type NotificationPrefs = Record<string, Record<string, boolean>>

export async function getNotificationPrefs(token: string): Promise<NotificationPrefs | null> {
  const { data } = await authFetch<NotificationPrefs>('/user/notification-prefs', token)
  return data ?? null
}

export async function setNotificationPref(topic: string, channel: string, enabled: boolean, token: string): Promise<{ data: NotificationPrefs | null; error?: string }> {
  return authFetch<NotificationPrefs>('/user/notification-prefs', token, { method: 'PUT', body: JSON.stringify({ topic, channel, enabled }) })
}
