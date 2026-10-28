'use client'

import { useState } from 'react'
import { searchItems, type Item } from '@/lib/api'
import CourseCard from '@/components/CourseCard'

const PAGE_SIZE = 12
const SORTS = [
  { key: 'popular', label: 'Phổ biến' },
  { key: 'newest', label: 'Mới nhất' },
] as const

interface Props {
  partnerId: number
  initialItems: Item[]
  total: number
}

/** The partner's live courses: the first page comes from the server, "Xem thêm" loads the rest, and the order can be switched to newest first. */
export default function PartnerCourses({ partnerId, initialItems, total }: Props) {
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('popular')
  const [items, setItems] = useState(initialItems)
  const [count, setCount] = useState(total)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)

  const load = async (nextSort: typeof sort, nextPage: number) => {
    setBusy(true)
    const res = await searchItems('', nextPage, PAGE_SIZE, { authorId: partnerId, sort: nextSort })
    setItems(prev => (nextPage === 0 ? res.items : [...prev, ...res.items.filter(i => !prev.some(p => p.id === i.id))]))
    setCount(res.total)
    setPage(nextPage)
    setBusy(false)
  }

  const changeSort = (key: typeof sort) => {
    if (key === sort || busy) return
    setSort(key)
    load(key, 0)
  }

  if (items.length === 0) return <p className="m-0 text-muted">Hiện chưa có khóa nào đang mở. Theo dõi để được báo khi có khóa mới.</p>

  return (
    <>
      {count > PAGE_SIZE && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Sắp xếp:</span>
          {SORTS.map(s => (
            <button key={s.key} type="button" onClick={() => changeSort(s.key)}
              className={`rounded-full border px-3 py-1 font-bold ${s.key === sort ? 'border-green bg-green-soft text-green-dark' : 'border-line bg-white text-muted'}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(item => <CourseCard key={item.id} item={item} />)}
      </div>
      {items.length < count && (
        <div className="mt-5 text-center">
          <button type="button" disabled={busy} onClick={() => load(sort, page + 1)} className="btn btn--outline py-2 text-sm">
            {busy ? 'Đang tải…' : `Xem thêm (${count - items.length} khóa)`}
          </button>
        </div>
      )}
    </>
  )
}
