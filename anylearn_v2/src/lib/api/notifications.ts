import { authFetch } from './client'

export interface AppNotification {
  id: number
  userId: number
  type: string
  title?: string
  content: string
  route?: string
  extraContent?: string
  isSend: number
  read?: string
  createdAt?: string
}

export interface NotificationListResult {
  items: AppNotification[]
  unread: number
  page: number
}

export async function getNotifications(token: string, page = 0): Promise<NotificationListResult> {
  const { data } = await authFetch<NotificationListResult>(`/user/notification?page=${page}`, token)
  return data ?? { items: [], unread: 0, page }
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await authFetch('/user/notification/mark-all-read', token, { method: 'POST' })
}

export async function markNotificationRead(id: number, token: string): Promise<void> {
  await authFetch(`/user/notification/${id}`, token)
}
