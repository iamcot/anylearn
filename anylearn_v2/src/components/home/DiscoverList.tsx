'use client'

import { useEffect, useState } from 'react'
import { getDiscover, type Item } from '@/lib/api'
import { discoverParams, discoverTitle } from '@/lib/home/discover'
import BackLink from '@/components/BackLink'
import CourseCard from '@/components/CourseCard'
import { CardGridSkeleton } from '@/components/PageSkeleton'
import { useHomeContext } from './useHomeContext'

const PAGE_SIZE = 12

// "Thử điều mới cho con": a day's list of courses the child has not tried, fitting their age and area. Same list all
// day for the same child, "Xem thêm" goes further down it.
export default function DiscoverList() {
  const { ready, context, chips, activeKey } = useHomeContext()
  const params = discoverParams(context)
  const key = JSON.stringify(params)
  const [loaded, setLoaded] = useState<{ key: string; items: Item[]; total: number; pages: number } | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    getDiscover(params, 0, PAGE_SIZE).then(result => {
      if (!cancelled) setLoaded({ key, items: result.items, total: result.total, pages: 1 })
    })
    return () => { cancelled = true }
    // `key` stands for `params`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, key])

  const current = loaded?.key === key ? loaded : null

  const more = async () => {
    if (!current) return
    setLoadingMore(true)
    const result = await getDiscover(params, current.pages, PAGE_SIZE)
    setLoadingMore(false)
    setLoaded({ ...current, items: [...current.items, ...result.items], pages: current.pages + 1 })
  }

  const childName = chips.find(chip => chip.key === activeKey)?.name
  return (
    <div className="container py-6 lg:py-10">
      <BackLink href="/?browse=1">Trang chủ</BackLink>
      <h1 className="mb-1 mt-3 text-2xl font-extrabold text-ink lg:text-4xl">{discoverTitle(context)}</h1>
      <p className="mb-6 mt-0 text-muted">
        Mỗi ngày một danh sách khác{childName ? `, chọn theo tuổi của ${childName}` : ''}{context.near ? ' và gần nhà bạn' : ''}.
      </p>

      {!current ? <CardGridSkeleton /> : current.items.length === 0 ? (
        <p className="text-muted">Chưa có khóa phù hợp. Bạn thử chọn bé khác hoặc xem toàn bộ khóa học ở trang tìm kiếm.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {current.items.map(item => <CourseCard key={item.id} item={item} />)}
          </div>
          {current.items.length < current.total && (
            <div className="mt-6 text-center">
              <button type="button" onClick={more} disabled={loadingMore} className="btn btn--outline">{loadingMore ? 'Đang tải...' : 'Xem thêm'}</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
