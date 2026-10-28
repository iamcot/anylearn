'use client'

import { useEffect, useState } from 'react'
import { CloseIcon } from '@/components/icons'
import { searchCreatorCourses, type CourseHit } from '@/lib/api/explore'
import { formatPrice } from '@/lib/format/price'

function CourseLine({ course }: { course: CourseHit }) {
  return (
    <>
      {course.image
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={course.image} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
        : <span className="size-11 shrink-0 rounded-lg bg-slate-200" />}
      <span className="min-w-0 flex-1 text-left">
        <span className="line-clamp-2 text-sm font-bold text-ink">{course.title}</span>
        {course.price != null && <span className="text-xs text-muted">{formatPrice(course.price)}</span>}
      </span>
    </>
  )
}

/** The course attached to a post: one compact card with ×, or a box that searches live courses by name. */
export default function CoursePicker({ token, value, onChange }: { token: string; value: CourseHit | null; onChange: (course: CourseHit | null) => void }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<CourseHit[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const words = q.trim()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (words.length < 2) { setHits([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const { data } = await searchCreatorCourses(token, words)
      setSearching(false)
      setHits(data?.items ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [token, q])

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-white p-2 ring-1 ring-line">
        <CourseLine course={value} />
        <button type="button" aria-label="Bỏ khóa học" onClick={() => onChange(null)} className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-slate-100 text-ink"><CloseIcon className="size-4" /></button>
      </div>
    )
  }
  return (
    <div>
      <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Gõ tên khóa học để tìm (tùy chọn)"
        className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-base outline-none focus:border-green" />
      {searching && <p className="mt-1 text-xs text-muted">Đang tìm...</p>}
      {hits.length > 0 && (
        <ul className="mt-1 max-h-72 list-none overflow-y-auto rounded-xl bg-white p-1 ring-1 ring-line">
          {hits.map(c => (
            <li key={c.id}>
              <button type="button" onClick={() => { onChange(c); setQ(''); setHits([]) }} className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent p-2 hover:bg-slate-50">
                <CourseLine course={c} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!searching && q.trim().length >= 2 && hits.length === 0 && <p className="mt-1 text-xs text-muted">Không thấy khóa học nào</p>}
    </div>
  )
}
