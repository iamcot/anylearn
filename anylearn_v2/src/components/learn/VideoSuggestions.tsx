'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCourseUrl } from '@/lib/api'
import { getVideoSuggestions } from '@/lib/api/learn'
import { dismissRecommendation, recordRecommendation, type Recommendation } from '@/lib/api/recommendations'
import { formatMoney } from '@/lib/today/format'

/** "Học tiếp khóa nào?": courses to take after a video course that is nearly or fully learned (plan 17.6), as a row that scrolls sideways. */
export default function VideoSuggestions({ token, itemId, learnerId, done }: { token: string; itemId: number; learnerId: number; done: boolean }) {
  const [recs, setRecs] = useState<Recommendation[]>([])
  useEffect(() => {
    let cancelled = false
    getVideoSuggestions(token, itemId, learnerId, 3).then(res => { if (!cancelled) setRecs(res.data ?? []) })
    return () => { cancelled = true }
  }, [token, itemId, learnerId])
  useEffect(() => {
    recs.forEach(rec => recordRecommendation(rec, 'video_done', 'view', token))
  }, [recs, token])
  if (recs.length === 0) return null

  const hide = (rec: Recommendation) => {
    setRecs(list => list.filter(r => r.itemId !== rec.itemId))
    dismissRecommendation(rec, token)
  }

  return (
    <section className="mt-6">
      <h2 className="mb-1 mt-0 text-lg font-extrabold text-ink">{done ? '🎉 Học xong rồi! Học tiếp khóa nào?' : 'Sắp xong khóa này, học tiếp khóa nào?'}</h2>
      <p className="mb-3 mt-0 text-sm text-muted">Gợi ý theo lộ trình, đơn vị dạy và chủ đề của khóa này.</p>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
        {recs.map(rec => (
          <article key={rec.itemId} className="relative w-[240px] shrink-0 snap-start overflow-hidden rounded-card border border-line bg-white">
            <Link href={`${getCourseUrl({ id: rec.itemId, seoUrl: rec.seoUrl ?? undefined, title: rec.title })}?child=${rec.learnerId}`}
              onClick={() => { recordRecommendation(rec, 'video_done', 'click', token) }} className="block text-inherit no-underline">
              <div className="aspect-video bg-bg">
                {rec.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rec.image} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-2 min-h-10 text-sm font-extrabold leading-snug text-ink">{rec.title}</div>
                <div className="mt-1 line-clamp-1 text-xs text-muted">{rec.reasonText}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-green-dark">{rec.price != null ? formatMoney(rec.price) : ''}</span>
                  <span className="rounded-full bg-green px-3 py-1 text-xs font-bold text-white">Xem khóa</span>
                </div>
              </div>
            </Link>
            <button type="button" aria-label="Không quan tâm" onClick={() => hide(rec)}
              className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/50 text-sm leading-none text-white">×</button>
          </article>
        ))}
      </div>
    </section>
  )
}
