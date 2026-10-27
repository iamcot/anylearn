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

/** A bar of dots, one per pathway step: filled = done, ring = the suggested next step; "Bạn ở đây" sits under the last finished one. */
function PathwayDots({ steps }: { steps?: Props['rec']['pathwayProgress'] }) {
  if (!steps || steps.length < 2) return null
  const current = steps.reduce((last, step, index) => (step.done ? index : last), -1)
  return (
    <div className="mt-3 flex items-start px-1" aria-label="Các bước của lộ trình">
      {steps.map((step, index) => (
        <div key={step.stepNo} className="relative flex flex-1 flex-col items-center">
          {index > 0 && (
            <span className={`absolute right-1/2 top-[7px] h-0.5 w-full ${steps[index - 1].done && step.done ? 'bg-green' : 'bg-line'}`} />
          )}
          <span className={`relative size-4 rounded-full border-2 ${
            step.done ? 'border-green bg-green' : step.next ? 'border-green bg-white ring-4 ring-green-soft' : 'border-line bg-white'}`} />
          <span className={`mt-1 text-[11px] leading-tight ${index === current ? 'font-black text-green-dark' : 'text-muted'}`}>
            {index === current ? 'Bạn ở đây' : step.next ? 'Tiếp theo' : step.skipped ? 'Bỏ qua' : `Bước ${index + 1}`}
          </span>
        </div>
      ))}
    </div>
  )
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
      <PathwayDots steps={rec.pathwayProgress} />
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
        {rec.pathwaySlug && (
          <Link href={`/pathway/${rec.pathwaySlug}?child=${rec.learnerId}`} className="text-sm font-bold text-green-dark no-underline">
            Xem toàn bộ lộ trình
          </Link>
        )}
        <button type="button" onClick={hide} className="min-h-11 px-2 text-sm font-semibold text-muted hover:text-ink">
          Không quan tâm
        </button>
      </div>
    </section>
  )
}
