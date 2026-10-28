'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getMyAchievements, type Achievement } from '@/lib/api/achievements'

/** The person's shareable banners (newest first); hidden while there are none. */
export default function MyAchievements({ token }: { token: string }) {
  const [items, setItems] = useState<Achievement[]>([])
  useEffect(() => {
    let cancelled = false
    getMyAchievements(token).then(({ data }) => { if (!cancelled && data) setItems(data) })
    return () => { cancelled = true }
  }, [token])
  if (items.length === 0) return null
  return (
    <section className="mt-4" aria-label="Thành tích của tôi">
      <h2 className="m-0 text-base font-extrabold">Thành tích của tôi</h2>
      <ul className="m-0 mt-2 grid list-none gap-2 p-0">
        {items.slice(0, 5).map(a => (
          <li key={a.token}>
            <Link href={`/fun/share/${a.token}`} className="flex items-center justify-between rounded-2xl border border-line bg-white px-3 py-2 text-ink no-underline">
              <span className="min-w-0"><span className="block truncate text-sm font-bold">{a.title}</span><span className="block truncate text-xs text-muted">{a.subtitle}</span></span>
              <span className="shrink-0 pl-2 text-sm font-bold text-green-dark">Chia sẻ ›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
