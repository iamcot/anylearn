'use client'

import { useEffect, useState } from 'react'
import { getVideoToday, type MyVideoCourse } from '@/lib/api/learn'
import VideoCourseCard from '@/components/learn/VideoCourseCard'

/** /today: video courses to continue, and the self-study sessions planned for today. */
export default function VideoTodayCard({ learnerId, token }: { learnerId: number; token: string }) {
  const [data, setData] = useState<{ continue: MyVideoCourse[]; sessions: MyVideoCourse[] } | null>(null)
  useEffect(() => {
    let cancelled = false
    getVideoToday(token, learnerId).then(res => { if (!cancelled && res.data) setData(res.data) })
    return () => { cancelled = true }
  }, [learnerId, token])
  if (!data || (data.continue.length === 0 && data.sessions.length === 0)) return null
  return (
    <section className="rounded-[20px] border border-line bg-white p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Tự học video</div>
      <div className="flex flex-col gap-3">
        {data.sessions.map(c => (
          <div key={`s-${c.itemId}`}>
            <div className="mb-1 text-xs font-bold text-green-dark">{c.plan?.time} · Hôm nay theo lịch</div>
            <VideoCourseCard course={c} showLearner={false} />
          </div>
        ))}
        {data.continue.map(c => <VideoCourseCard key={`c-${c.itemId}`} course={c} showLearner={false} />)}
      </div>
    </section>
  )
}
