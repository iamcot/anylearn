'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getMyAchievements, type Achievement } from '@/lib/api/achievements'
import { TrophyIcon } from '../TitleIcons'
import AchievementCard from './AchievementCard'

/** The newest shareable banners on /fun (three, with "Xem tất cả" for the rest); hidden while there are none. */
export default function MyAchievements({ token, limit = 3 }: { token: string; limit?: number }) {
  const [items, setItems] = useState<Achievement[]>([])
  useEffect(() => {
    let cancelled = false
    // one more than shown tells whether "Xem tất cả" has anything to add
    getMyAchievements(token, limit + 1).then(({ data }) => { if (!cancelled && data) setItems(data) })
    return () => { cancelled = true }
  }, [token, limit])
  if (items.length === 0) return null
  return (
    <section className="mt-4" aria-label="Thành tích của tôi">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 flex items-center gap-1.5 text-base font-extrabold"><TrophyIcon /> Thành tích của tôi</h2>
        <Link href="/fun/achievements" className="text-sm font-bold text-green-dark no-underline">Xem tất cả ›</Link>
      </div>
      <ul className="m-0 mt-2 grid list-none gap-2.5 p-0">
        {items.slice(0, limit).map(a => <li key={a.token}><AchievementCard achievement={a} /></li>)}
      </ul>
    </section>
  )
}
