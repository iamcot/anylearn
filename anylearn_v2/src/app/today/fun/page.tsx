'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getCheckin, type CheckinStatus } from '@/lib/api/fun'
import FunScene from '@/components/fun/FunScene'

const COMING = [
  { icon: '🧩', title: 'Đố vui leo rank', text: 'Trả lời câu hỏi, lên hạng và so tài trên bảng xếp hạng' },
  { icon: '🦊', title: 'Sticker', text: 'Sưu tầm bộ sticker và đổi với bạn bè' },
  { icon: '📖', title: 'Khám phá', text: 'Mẹo nuôi dạy con, clip và hình ảnh vui' },
]

export default function FunPage() {
  const router = useRouter()
  const { user, token, isAuthLoading } = useAuth()
  const [status, setStatus] = useState<CheckinStatus | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthLoading && !user) router.replace('/login?redirect=/today/fun')
  }, [isAuthLoading, user, router])

  useEffect(() => {
    if (!token) return
    getCheckin(token).then(({ data, error: err }) => {
      if (err || !data) return setError(err ?? 'Không tải được trang Vui học')
      setStatus(data)
    })
  }, [token])

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <h1 className="text-2xl font-black lg:text-3xl">Vui học</h1>
      <p className="mt-1 text-sm text-muted">Giải trí nhẹ nhàng lúc chờ con, nhận anyPoint mỗi ngày.</p>
      {error && <p className="mt-4 text-warn-text">{error}</p>}
      {!error && !status && <div className="mt-4 h-[250px] animate-pulse rounded-[22px] bg-slate-200" />}
      {status && token && <div className="mt-4"><FunScene token={token} initial={status} /></div>}

      <h2 className="mb-2 mt-6 text-base font-extrabold">Sắp ra mắt</h2>
      <ul className="m-0 grid list-none gap-2 p-0">
        {COMING.map(c => (
          <li key={c.title} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-green-soft text-2xl" aria-hidden>{c.icon}</span>
            <div className="min-w-0"><div className="font-bold">{c.title}</div><div className="text-sm text-muted">{c.text}</div></div>
          </li>
        ))}
      </ul>
    </div>
  )
}
