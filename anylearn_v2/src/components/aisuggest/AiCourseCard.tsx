'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { getCourseUrl } from '@/lib/api'
import { recordRecommendation, type Recommendation } from '@/lib/api/recommendations'
import { formatMoney } from '@/lib/today/format'

/** One course of the AI list: picture, name, the reason in the AI's words and the price. Shown and clicked are counted. */
export default function AiCourseCard({ rec, token }: { rec: Recommendation; token: string }) {
  useEffect(() => {
    recordRecommendation(rec, 'ai_suggest', 'view', token)
  }, [rec, token])

  return (
    <Link
      href={getCourseUrl({ id: rec.itemId, seoUrl: rec.seoUrl ?? undefined, title: rec.title })}
      onClick={() => { recordRecommendation(rec, 'ai_suggest', 'click', token) }}
      className="flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-white no-underline transition-shadow hover:shadow-raised"
    >
      <div className="aspect-[4/3] w-full bg-surface">
        {rec.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.image} alt="" loading="lazy" className="size-full object-cover" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="m-0 line-clamp-2 text-sm font-black leading-snug text-ink">{rec.title}</h3>
        {rec.reasonText && <p className="m-0 line-clamp-3 text-xs text-muted"><span aria-hidden>✨ </span>{rec.reasonText}</p>}
        {rec.price != null && <p className="m-0 mt-auto pt-1 text-sm font-black text-green-dark">{formatMoney(rec.price)}</p>}
      </div>
    </Link>
  )
}
