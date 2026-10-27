'use client'

import { useEffect, useState } from 'react'
import { getTodayRecommendations, type Recommendation } from '@/lib/api/recommendations'
import RecommendationCard from './RecommendationCard'

/** At most one suggestion on /today (plan 08.3); nothing at all when nothing fits. */
export default function TodayRecommendation({ learnerId, token }: { learnerId: number; token: string }) {
  const [rec, setRec] = useState<Recommendation | null>(null)

  useEffect(() => {
    let cancelled = false
    getTodayRecommendations(learnerId, token).then(({ data }) => { if (!cancelled) setRec(data?.[0] ?? null) })
    return () => { cancelled = true }
  }, [learnerId, token])

  if (!rec) return null
  return <RecommendationCard rec={rec} context="today" token={token} onHidden={() => setRec(null)} />
}
