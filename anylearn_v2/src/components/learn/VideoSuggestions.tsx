'use client'

import { useEffect, useState } from 'react'
import RecommendationCard from '@/components/recommendations/RecommendationCard'
import { getVideoSuggestions } from '@/lib/api/learn'
import type { Recommendation } from '@/lib/api/recommendations'

/** "Học tiếp khóa nào?": courses to take after a video course that is nearly or fully learned (plan 17.6). */
export default function VideoSuggestions({ token, itemId, learnerId, done }: { token: string; itemId: number; learnerId: number; done: boolean }) {
  const [recs, setRecs] = useState<Recommendation[]>([])
  useEffect(() => {
    let cancelled = false
    getVideoSuggestions(token, itemId, learnerId, 3).then(res => { if (!cancelled) setRecs(res.data ?? []) })
    return () => { cancelled = true }
  }, [token, itemId, learnerId])
  if (recs.length === 0) return null
  return (
    <section className="mt-6">
      <h2 className="mb-1 text-lg font-extrabold text-ink">{done ? '🎉 Học xong rồi! Học tiếp khóa nào?' : 'Sắp xong khóa này, học tiếp khóa nào?'}</h2>
      <p className="mb-3 text-sm text-muted">Gợi ý theo lộ trình, đơn vị dạy và chủ đề của khóa này.</p>
      <div className="flex flex-col gap-3">
        {recs.map(rec => (
          <RecommendationCard key={rec.itemId} rec={rec} context="video_done" token={token}
            onHidden={() => setRecs(list => list.filter(r => r.itemId !== rec.itemId))} />
        ))}
      </div>
    </section>
  )
}
