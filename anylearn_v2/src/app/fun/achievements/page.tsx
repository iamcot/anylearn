'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ChevronLeftIcon } from '@/components/icons'
import { TrophyIcon } from '@/components/fun/TitleIcons'
import AchievementCard from '@/components/fun/share/AchievementCard'
import { getMyAchievements, type Achievement } from '@/lib/api/achievements'

/** Every achievement banner of the person, newest first ("Xem tất cả" on /fun). */
export default function AchievementsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Achievement[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getMyAchievements(token, 200).then(({ data, error: err }) => {
      if (cancelled) return
      if (err || !data) return setError(err ?? 'Không tải được thành tích')
      setItems(data)
    })
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href="/fun" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-text no-underline"><ChevronLeftIcon className="size-4" /> Vui học</Link>
      <h1 className="m-0 flex items-center gap-2 text-2xl font-black lg:text-3xl"><TrophyIcon className="size-8" /> Thành tích của tôi</h1>
      {error && <p className="mt-4 text-warn-text">{error}</p>}
      {!error && !items && <div className="mt-4 h-40 animate-pulse rounded-2xl bg-slate-200" />}
      {items && items.length === 0 && <p className="mt-4 rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Bạn chưa có thành tích nào. Leo rank, điểm danh đều đặn hay sưu tầm đủ bộ sticker để nhận banner nhé!</p>}
      {items && items.length > 0 && (
        <ul className="m-0 mt-4 grid list-none gap-2.5 p-0">
          {items.map(a => <li key={a.token}><AchievementCard achievement={a} /></li>)}
        </ul>
      )}
    </div>
  )
}
