'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getCourseUrl } from '@/lib/api'
import { API_BASE } from '@/lib/apiBase'
import AccountCard from '@/components/account/AccountCard'
import ChevronLabel from '@/components/ChevronLabel'
import { ListSkeleton } from '@/components/PageSkeleton'
import { BookIcon, HeartIcon } from '@/components/icons'

interface FavItem {
  id: number
  title: string
  image?: string
  shortContent?: string
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<FavItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch(`${API_BASE}/user/favorites`, { headers: { Authorization: `Bearer ${user.jwtToken}` } })
      .then(response => response.json())
      .then(json => setItems(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <AccountCard title={<span className="flex items-center gap-2"><HeartIcon filled className="size-5 text-red" />Khóa học yêu thích</span>}>
      {loading ? (
        <div className="p-5"><ListSkeleton showTitle={false} /></div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted">
          Bạn chưa yêu thích khóa học nào.<br />
          <Link href="/search" className="mt-2 inline-flex min-h-11 items-center font-bold text-blue no-underline hover:underline">
            <ChevronLabel>Khám phá khóa học</ChevronLabel>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-line">
          {items.map(item => {
            const url = getCourseUrl({ id: item.id, title: item.title })
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <Link href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {item.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={item.image} alt="" loading="lazy" className="size-14 rounded-[10px] object-cover" />
                    : <div className="grid size-14 place-items-center rounded-[10px] bg-gradient-to-br from-green-soft to-blue-soft text-blue/40"><BookIcon className="size-6" /></div>
                  }
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={url} target="_blank" rel="noopener noreferrer" className="line-clamp-2 block text-sm font-extrabold text-ink no-underline hover:underline">
                    {item.title}
                  </Link>
                  {item.shortContent && <p className="m-0 mt-0.5 line-clamp-1 text-xs text-muted">{item.shortContent}</p>}
                </div>
                <Link href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 shrink-0 items-center text-xs font-bold text-blue no-underline hover:underline">
                  <ChevronLabel>Xem</ChevronLabel>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </AccountCard>
  )
}
