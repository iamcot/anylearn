'use client'

import { useEffect, useState } from 'react'
import { getOrderRecommendations, type Recommendation } from '@/lib/api/recommendations'
import RecommendationCard from './RecommendationCard'

/** After an order: courses for the other children of the account, for example next to the class a sibling just joined. */
export default function OrderRecommendations({ orderId, token }: { orderId: string; token: string }) {
  const [recs, setRecs] = useState<Recommendation[]>([])

  useEffect(() => {
    let cancelled = false
    getOrderRecommendations(orderId, token).then(({ data }) => { if (!cancelled && data) setRecs(data) })
    return () => { cancelled = true }
  }, [orderId, token])

  if (recs.length === 0) return null
  return (
    <div className="mb-5 space-y-3 text-left">
      {recs.map(rec => (
        <RecommendationCard
          key={`${rec.learnerId}-${rec.itemId}`} rec={rec} context="order_success" token={token}
          onHidden={() => setRecs(list => list.filter(item => item !== rec))}
        />
      ))}
    </div>
  )
}
