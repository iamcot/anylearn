import type { ReviewSummary } from '@/lib/api'
import { REVIEW_CRITERIA } from '@/config/reviews'
import { distributionPercents } from '@/lib/reviews/text'
import StarRating from '@/components/StarRating'
import { StarIcon } from '@/components/icons'

// The numbers at the top of the reviews: average, how the stars spread, the score of each criterion and the photos.
export default function ReviewSummaryCard({ summary }: { summary: ReviewSummary }) {
  if (summary.count === 0 || summary.average === null) return null
  const criteria = REVIEW_CRITERIA.filter(criterion => summary.criteria[criterion.id] !== undefined)

  return (
    <div className="mb-5 rounded-[18px] border border-line bg-white p-5">
      <div className="grid gap-5 md:grid-cols-[180px_1fr_1fr]">
        <div>
          <div className="text-4xl font-extrabold text-ink">{summary.average.toFixed(1)}</div>
          <StarRating value={summary.average} className="size-4" />
          <div className="mt-1 text-sm text-muted">{summary.count} đánh giá</div>
        </div>

        <ul className="m-0 grid list-none gap-1.5 p-0" aria-label="Phân bố số sao">
          {distributionPercents(summary.distribution, summary.count).map(row => (
            <li key={row.stars} className="grid grid-cols-[32px_1fr_36px] items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-0.5 whitespace-nowrap" aria-label={`${row.stars} sao`}>{row.stars}<StarIcon filled className="size-3 text-star" /></span>
              <span className="h-2 overflow-hidden rounded-full bg-bg"><span className="block h-full rounded-full bg-star" style={{ width: `${row.percent}%` }} /></span>
              <span className="text-right">{row.percent}%</span>
            </li>
          ))}
        </ul>

        {criteria.length > 0 && (
          <ul className="m-0 grid list-none content-start gap-1.5 p-0" aria-label="Điểm theo tiêu chí">
            {criteria.map(criterion => (
              <li key={criterion.id} className="flex items-center justify-between gap-3 text-sm text-text">
                <span>{criterion.label}</span>
                <span className="font-medium text-ink">{summary.criteria[criterion.id]?.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {summary.photos.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {summary.photos.map(url => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="size-16 shrink-0 overflow-hidden rounded-xl bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Ảnh từ phụ huynh" loading="lazy" className="size-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
