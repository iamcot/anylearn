'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { getCourseUrl } from '@/lib/api'
import {
  dismissRecommendation, recordRecommendation,
  type Recommendation, type RecommendationContext,
} from '@/lib/api/recommendations'
import { formatMoney } from '@/lib/today/format'

interface Props {
  rec: Recommendation
  context: RecommendationContext
  token: string
  onHidden: () => void
}

/** One suggestion with the reason a parent reads. Shown and clicked are counted; "Không quan tâm" hides it for a while. */
export default function RecommendationCard({ rec, context, token, onHidden }: Props) {
  useEffect(() => {
    recordRecommendation(rec, context, 'view', token)
  }, [rec, context, token])

  async function hide() {
    onHidden()
    await dismissRecommendation(rec, token)
  }

  return (
    <section className="rounded-[20px] border border-line bg-white p-4">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">Gợi ý cho {rec.learnerName}</span>
      <p className="mt-1 text-sm text-ink">{rec.reasonText}</p>
      <div className="mt-3 flex items-center gap-3">
        {rec.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.image} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0">
          <h3 className="text-base font-black text-ink">{rec.title}</h3>
          {rec.price != null && <p className="text-sm text-muted">{formatMoney(rec.price)}</p>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          href={getCourseUrl({ id: rec.itemId, seoUrl: rec.seoUrl ?? undefined, title: rec.title })}
          onClick={() => { recordRecommendation(rec, context, 'click', token) }}
          className="inline-flex min-h-11 items-center rounded-full bg-green px-5 text-[15px] font-black text-white hover:bg-green-dark"
        >
          Xem khóa học
        </Link>
        <button type="button" onClick={hide} className="min-h-11 px-2 text-sm font-semibold text-muted hover:text-ink">
          Không quan tâm
        </button>
      </div>
    </section>
  )
}
