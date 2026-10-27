import { authFetch } from './client'

export interface ChatRoomSummary {
  id: number
  title: string
  locked: boolean
  role: 'member' | 'moderator'
  joined: boolean
  unread: number
  last_body: string | null
  last_at: string | null
}

export interface ChatMessage {
  id: number
  type: 'text' | 'announcement' | 'system'
  mine: boolean
  name: string
  role: 'member' | 'moderator'
  hidden: boolean
  body: string
  pinned: boolean
  createdAt: string
  replyTo?: { id: number; name: string; body: string } | null
}

export interface ChatRoom {
  id: number
  title: string
  locked: boolean
  role: 'member' | 'moderator'
  joined: boolean
  displayName: string | null
  /** The member's class(es) of the course, added after the name in the group. */
  classLabel: string | null
  banned: boolean
  rulesText: string
  pinned: ChatMessage[]
}

type Result<T> = Promise<{ data: T | null; error?: string }>

const post = <T,>(path: string, token: string, body: object): Result<T> =>
  authFetch<T>(path, token, { method: 'POST', body: JSON.stringify(body) })

export const getChatRooms = (token: string): Result<{ enabled: boolean; rooms: ChatRoomSummary[] }> => authFetch('/chat/rooms', token)
export const getChatUnread = (token: string): Result<{ unread: number }> => authFetch('/chat/unread', token)
export const getChatRoom = (roomId: number, token: string): Result<ChatRoom> => authFetch(`/chat/rooms/${roomId}`, token)
export const joinChatRoom = (roomId: number, displayName: string, token: string): Result<ChatRoom> =>
  post(`/chat/rooms/${roomId}/join`, token, { displayName, acceptRules: true })

/** `after` = only newer messages (polling); `before` = the page of older ones. */
export function getChatMessages(roomId: number, token: string, opts: { before?: number; after?: number } = {}): Result<ChatMessage[]> {
  const query = opts.after ? `?after=${opts.after}` : opts.before ? `?before=${opts.before}` : ''
  return authFetch(`/chat/rooms/${roomId}/messages${query}`, token)
}

export const sendChatMessage = (roomId: number, token: string, body: string, replyToId?: number, announcement = false): Result<ChatMessage> =>
  post(`/chat/rooms/${roomId}/messages`, token, { body, replyToId, announcement })
export const markChatRead = (roomId: number, messageId: number, token: string): Result<unknown> => post(`/chat/rooms/${roomId}/read`, token, { messageId })
export const reportChatMessage = (messageId: number, reason: string, token: string): Result<unknown> => post(`/chat/messages/${messageId}/report`, token, { reason })
export const hideChatMessage = (messageId: number, hidden: boolean, token: string): Result<unknown> => post(`/chat/messages/${messageId}/hide`, token, { hidden })
export const pinChatMessage = (messageId: number, pinned: boolean, token: string): Result<unknown> => post(`/chat/messages/${messageId}/pin`, token, { pinned })
