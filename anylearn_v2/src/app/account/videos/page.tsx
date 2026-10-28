'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getMyVideoCourses, type MyVideoCourse } from '@/lib/api/learn'
import VideoCourseCard from '@/components/learn/VideoCourseCard'
import { ListSkeleton } from '@/components/PageSkeleton'

export default function MyVideoCoursesPage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState<MyVideoCourse[] | null>(null)
  useEffect(() => {
    if (!token) return
    let cancelled = false
    getMyVideoCourses(token).then(res => { if (!cancelled) setCourses(res.data ?? []) })
    return () => { cancelled = true }
  }, [token])

  if (courses == null) return <ListSkeleton />
  const learners = new Set(courses.map(c => c.learnerId))
  return (
    <div>
      <h1 className="mb-4 text-xl font-black text-ink">Khóa học video của tôi</h1>
      {courses.length === 0 ? (
        <div className="rounded-card border border-line bg-white p-6 text-center">
          <p className="mb-3 text-sm text-muted">Bạn chưa đăng ký khóa học video nào.</p>
          <Link href="/search" className="btn btn--green py-2 text-sm">Tìm khóa học</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {courses.map(c => <VideoCourseCard key={`${c.learnerId}-${c.itemId}`} course={c} showLearner={learners.size > 1} />)}
        </div>
      )}
    </div>
  )
}
