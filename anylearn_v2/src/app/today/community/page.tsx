'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getChatRooms, type ChatRoomSummary } from '@/lib/api/chat'
import { formatChatTime } from '@/lib/chat/format'

export default function CommunityPage() {
  const router = useRouter()
  const { user, token, isAuthLoading } = useAuth()
  const [rooms, setRooms] = useState<ChatRoomSummary[] | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthLoading && !user) router.replace('/login?redirect=/today/community')
  }, [isAuthLoading, user, router])

  useEffect(() => {
    if (!token) return
    getChatRooms(token).then(({ data, error: err }) => {
      if (err || !data) return setError(err ?? 'Không tải được danh sách nhóm')
      setEnabled(data.enabled)
      setRooms(data.rooms)
    })
  }, [token])

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <h1 className="text-2xl font-black lg:text-3xl">Nhóm lớp</h1>
      <p className="mt-1 text-sm text-muted">Trao đổi với phụ huynh và giáo viên cùng lớp.</p>
      {error && <p className="mt-4 text-warn-text">{error}</p>}
      {!error && rooms === null && <div className="mt-4 h-20 animate-pulse rounded-2xl bg-slate-200" />}
      {rooms && (!enabled || rooms.length === 0) && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-center">
          <p className="font-bold">{enabled ? 'Bạn chưa có nhóm lớp nào' : 'Nhóm lớp đang tạm đóng'}</p>
          {enabled && <p className="mt-1 text-sm text-muted">Nhóm sẽ xuất hiện khi bạn đăng ký một lớp học.</p>}
          <Link href="/today" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-green px-5 text-[15px] font-black text-white no-underline">Về Hôm nay</Link>
        </div>
      )}
      {rooms && enabled && rooms.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {rooms.map(room => (
            <li key={room.id}>
              <Link href={`/today/community/${room.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 no-underline">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-soft font-black text-green">{room.title.charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-extrabold text-ink">{room.title}</span>
                    <span className="shrink-0 text-xs text-muted">{formatChatTime(room.last_at)}</span>
                  </span>
                  <span className="block truncate text-sm text-muted">{room.last_body ?? 'Chưa có tin nhắn'}</span>
                </span>
                {room.unread > 0 && (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-green px-1.5 text-xs font-extrabold text-white">{room.unread > 99 ? '99+' : room.unread}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
