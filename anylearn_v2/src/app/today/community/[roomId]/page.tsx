'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'
import {
  getChatMessages, getChatRoom, hideChatMessage, joinChatRoom, markChatRead, pinChatMessage, reportChatMessage, sendChatMessage,
  type ChatMessage, type ChatRoom,
} from '@/lib/api/chat'
import { chatDayLabel, formatChatTime, mergeMessages } from '@/lib/chat/format'

const POLL_MS = 10000
const btnGreen = 'inline-flex min-h-11 items-center justify-center rounded-full bg-green px-5 text-[15px] font-black text-white disabled:opacity-50'

function JoinGate({ room, onJoin }: { room: ChatRoom; onJoin: (name: string) => Promise<string | null> }) {
  const [name, setName] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    setError(await onJoin(name) ?? '')
    setBusy(false)
  }

  return (
    <div className="mx-auto max-w-[520px] px-4 py-6">
      <h2 className="text-xl font-black">Vào nhóm {room.title}</h2>
      <label className="mt-4 block text-sm font-bold" htmlFor="chat-name">Tên hiển thị trong nhóm</label>
      <input id="chat-name" value={name} onChange={event => setName(event.target.value)} maxLength={30} placeholder="Ví dụ: Mẹ Bin"
        className="mt-1 min-h-11 w-full rounded-xl border border-line px-3 text-[16px]" />
      <p className="mt-1 text-xs text-muted">Các phụ huynh khác chỉ thấy tên này, không thấy số điện thoại hay email của bạn.</p>
      <div className="mt-4 whitespace-pre-line rounded-2xl bg-green-soft p-4 text-sm">{room.rulesText}</div>
      <label className="mt-4 flex items-start gap-2 text-sm font-semibold">
        <input type="checkbox" checked={agree} onChange={event => setAgree(event.target.checked)} className="mt-1 h-4 w-4 accent-green" />
        Tôi đã đọc và đồng ý nội quy nhóm
      </label>
      {error && <p className="mt-3 text-warn-text">{error}</p>}
      <button type="button" onClick={submit} disabled={busy || !agree || name.trim().length < 2} className={`${btnGreen} mt-4 w-full`}>Vào nhóm</button>
    </div>
  )
}

function Bubble({ message, canModerate, onReply, onReport, onHide, onPin }: {
  message: ChatMessage
  canModerate: boolean
  onReply: () => void
  onReport: () => void
  onHide: () => void
  onPin: () => void
}) {
  const [open, setOpen] = useState(false)
  const mine = message.mine
  const announce = message.type === 'announcement'
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <span className="mb-0.5 px-1 text-xs text-muted">
        {mine ? 'Bạn' : message.name}{message.role === 'moderator' && ' · Giáo viên / đối tác'}
      </span>
      <button type="button" onClick={() => setOpen(value => !value)}
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-left text-[15px] ${
          message.hidden ? 'bg-slate-100 italic text-muted' : announce ? 'border border-green bg-green-soft text-ink' : mine ? 'bg-green text-white' : 'bg-white text-ink ring-1 ring-line'}`}>
        {announce && !message.hidden && <span className="mb-1 block text-xs font-black text-green-dark">THÔNG BÁO CẢ LỚP</span>}
        {message.replyTo && !message.hidden && (
          <span className="mb-1 block rounded-lg bg-black/10 px-2 py-1 text-xs"><b>{message.replyTo.name}</b>: {message.replyTo.body}</span>
        )}
        {message.body}
        <span className={`mt-1 block text-right text-[11px] ${mine && !announce && !message.hidden ? 'text-white/80' : 'text-muted'}`}>{formatChatTime(message.createdAt)}</span>
      </button>
      {open && !message.hidden && (
        <div className="mt-1 flex gap-3 px-1 text-sm font-bold text-green-dark">
          <button type="button" onClick={() => { setOpen(false); onReply() }}>Trả lời</button>
          {!mine && <button type="button" onClick={() => { setOpen(false); onReport() }}>Báo cáo</button>}
          {canModerate && <button type="button" onClick={() => { setOpen(false); onPin() }}>{message.pinned ? 'Bỏ ghim' : 'Ghim'}</button>}
          {canModerate && <button type="button" onClick={() => { setOpen(false); onHide() }}>Ẩn tin</button>}
        </div>
      )}
    </div>
  )
}

export default function ChatRoomPage() {
  const router = useRouter()
  const roomId = Number(useParams<{ roomId: string }>().roomId)
  const { user, token, isAuthLoading } = useAuth()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [announce, setAnnounce] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastId = useRef(0)

  useEffect(() => {
    if (!isAuthLoading && !user) router.replace(`/login?redirect=/today/community/${roomId}`)
  }, [isAuthLoading, user, router, roomId])

  const loadRoom = useCallback(async () => {
    if (!token) return
    const { data, error: err } = await getChatRoom(roomId, token)
    if (err || !data) return setError(err ?? 'Không mở được nhóm')
    setRoom(data)
  }, [token, roomId])

  useEffect(() => {
    if (!token) return
    getChatRoom(roomId, token).then(({ data, error: err }) => {
      if (err || !data) return setError(err ?? 'Không mở được nhóm')
      setRoom(data)
    })
  }, [token, roomId])

  const joined = room?.joined && !room.banned

  const poll = useCallback(async () => {
    if (!token || !joined) return
    const after = lastId.current
    const { data } = await getChatMessages(roomId, token, after ? { after } : {})
    if (!data || data.length === 0) return
    setMessages(current => mergeMessages(current, data))
    const newest = data[data.length - 1].id
    if (newest > lastId.current) {
      lastId.current = newest
      void markChatRead(roomId, newest, token)
    }
  }, [token, roomId, joined])

  useEffect(() => {
    if (!joined) return
    void poll()
    const timer = setInterval(() => { if (!document.hidden) void poll() }, POLL_MS)
    return () => clearInterval(timer)
  }, [joined, poll])

  // A new message of this room arrives at once through the notification stream; polling is only the fallback.
  const apiToken = user?.apiToken
  useEffect(() => {
    if (!joined || !apiToken) return
    const es = new EventSource(`${API_BASE}/user/notification/stream?api_token=${apiToken}`)
    es.addEventListener('chat', event => { if (Number((event as MessageEvent).data) === roomId) void poll() })
    return () => es.close()
  }, [joined, apiToken, roomId, poll])

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  const join = async (name: string): Promise<string | null> => {
    if (!token) return 'Chưa đăng nhập'
    const { data, error: err } = await joinChatRoom(roomId, name, token)
    if (err || !data) return err ?? 'Không vào được nhóm'
    setRoom(data)
    return null
  }

  const send = async () => {
    if (!token || !text.trim() || sending) return
    setSending(true)
    setNotice('')
    const { data, error: err } = await sendChatMessage(roomId, token, text.trim(), replyTo?.id, announce)
    setSending(false)
    if (err || !data) return setNotice(err ?? 'Không gửi được')
    setText('')
    setReplyTo(null)
    setAnnounce(false)
    lastId.current = Math.max(lastId.current, data.id)
    setMessages(current => mergeMessages(current, [data]))
  }

  const loadOlder = async () => {
    if (!token || messages.length === 0) return
    const { data } = await getChatMessages(roomId, token, { before: messages[0].id })
    if (data) setMessages(current => mergeMessages(current, data))
  }

  const report = async (message: ChatMessage) => {
    if (!token) return
    const reason = window.prompt('Lý do báo cáo tin nhắn này?')
    if (!reason) return
    const { error: err } = await reportChatMessage(message.id, reason, token)
    setNotice(err ?? 'Đã gửi báo cáo, anyLEARN sẽ xem xét. Cảm ơn bạn.')
  }

  const moderate = async (action: Promise<{ error?: string }>) => {
    const { error: err } = await action
    if (err) return setNotice(err)
    lastId.current = 0
    setMessages([])
    void loadRoom()
    void poll()
  }

  if (isAuthLoading || !user) return <div className="px-4 py-6"><div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" /></div>
  if (error) return (
    <div className="mx-auto max-w-[520px] px-4 py-10 text-center">
      <p className="text-warn-text">{error}</p>
      <Link href="/today/community" className={`${btnGreen} mt-4 no-underline`}>Về danh sách nhóm</Link>
    </div>
  )
  if (!room) return <div className="px-4 py-6"><div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" /></div>
  if (room.banned) return <div className="px-4 py-10 text-center text-warn-text">Bạn đã bị khóa chat. Vui lòng liên hệ anyLEARN nếu cần hỗ trợ.</div>
  if (!room.joined) return <JoinGate room={room} onJoin={join} />

  const moderator = room.role === 'moderator'
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-76px)] max-w-[720px] flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-white px-4 py-3">
        <Link href="/today/community" className="text-xl font-black text-green no-underline" aria-label="Quay lại">‹</Link>
        <h1 className="truncate text-base font-black">{room.title}</h1>
      </div>
      {room.pinned.length > 0 && (
        <div className="border-b border-line bg-green-soft px-4 py-2 text-sm">
          {room.pinned.map(pinned => <p key={pinned.id} className="truncate"><b>Ghim · {pinned.name}:</b> {pinned.body}</p>)}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 px-4 py-3 pb-4">
        {messages.length >= 40 && <button type="button" onClick={loadOlder} className="self-center text-sm font-bold text-green-dark">Xem tin cũ hơn</button>}
        {messages.map((message, index) => {
          const day = chatDayLabel(message.createdAt)
          const divider = index === 0 || day !== chatDayLabel(messages[index - 1].createdAt)
          return (
            <div key={message.id} className="flex flex-col gap-2">
              {divider && <p className="self-center rounded-full bg-slate-100 px-3 py-0.5 text-xs text-muted">{day}</p>}
              <Bubble
                message={message}
                canModerate={moderator}
                onReply={() => setReplyTo(message)}
                onReport={() => void report(message)}
                onHide={() => token && void moderate(hideChatMessage(message.id, true, token))}
                onPin={() => token && void moderate(pinChatMessage(message.id, !message.pinned, token))}
              />
            </div>
          )
        })}
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Chưa có tin nhắn. Hãy là người đầu tiên chào lớp.</p>}
        <div ref={bottomRef} />
      </div>
      <div className="sticky bottom-[calc(3.75rem+var(--app-tabs-pad))] border-t border-line bg-white px-3 py-2 lg:bottom-0">
        {notice && <p className="mb-1 text-sm font-semibold text-green-dark">{notice}</p>}
        {room.locked && !moderator ? (
          <p className="py-2 text-center text-sm text-muted">Nhóm đang tạm khóa, bạn chỉ đọc được tin nhắn.</p>
        ) : (
          <>
            {replyTo && (
              <p className="mb-1 flex items-center justify-between rounded-lg bg-slate-100 px-2 py-1 text-xs">
                <span className="truncate">Trả lời {replyTo.name}: {replyTo.body}</span>
                <button type="button" onClick={() => setReplyTo(null)} aria-label="Hủy trả lời" className="px-2 font-black">×</button>
              </p>
            )}
            {moderator && (
              <label className="mb-1 flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" checked={announce} onChange={event => setAnnounce(event.target.checked)} className="accent-green" />
                Gửi như thông báo cả lớp (mọi thành viên nhận thông báo)
              </label>
            )}
            <div className="flex items-end gap-2">
              <textarea value={text} onChange={event => setText(event.target.value)} rows={1} maxLength={1000} placeholder="Nhập tin nhắn…"
                onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && window.innerWidth >= 1024) { event.preventDefault(); void send() } }}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-line px-3 py-2.5 text-[16px]" />
              <button type="button" onClick={send} disabled={sending || !text.trim()} className={btnGreen}>Gửi</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
