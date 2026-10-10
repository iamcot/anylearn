'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getCourseUrl } from '@/lib/api'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface FavItem {
  id: number
  title: string
  image?: string
  shortContent?: string
}

function formatPrice(p: number) {
  if (!p) return 'Liên hệ'
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1).replace('.0', '')} triệu`
  return p.toLocaleString('vi-VN') + ' đ'
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<FavItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetch(`${BASE}/v3/auth/favorites`, {
      headers: { Authorization: `Bearer ${user.jwtToken}` },
    })
      .then(r => r.json())
      .then(json => {
        setItems(json.data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  return (
    <div className="bg-white border border-line rounded-card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="m-0 text-lg font-black text-ink">❤️ Khóa học yêu thích</h2>
      </div>

      {loading ? (
        <div className="p-5 text-muted text-sm">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-muted text-sm">
          Bạn chưa yêu thích khóa học nào.<br />
          <Link href="/search" className="text-[#00539b] font-bold no-underline hover:underline mt-2 inline-block">
            Khám phá khóa học →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-line">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-4">
              <Link href={getCourseUrl({ id: item.id, title: item.title })} target="_blank" rel="noopener noreferrer"
                className="shrink-0">
                {item.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.image} alt={item.title} className="w-14 h-14 rounded-[10px] object-cover" />
                  : <div className="w-14 h-14 rounded-[10px] bg-[linear-gradient(135deg,#dff7e8,#e7f3ff)] grid place-items-center text-2xl">📚</div>
                }
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={getCourseUrl({ id: item.id, title: item.title })} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-black text-ink no-underline hover:underline line-clamp-2 block">
                  {item.title}
                </Link>
                {item.shortContent && (
                  <p className="text-xs text-muted m-0 mt-0.5 line-clamp-1">{item.shortContent}</p>
                )}
              </div>
              <Link href={getCourseUrl({ id: item.id, title: item.title })} target="_blank" rel="noopener noreferrer"
                className="shrink-0 text-xs font-bold text-[#00539b] no-underline hover:underline">
                Xem →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
