'use client'

import { useCallback, useEffect, useState } from 'react'
import { getReviews, getReviewSummary, type PdpReview, type ReviewSummary } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { REVIEWS_SHOWN_FIRST } from '@/config/reviews'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from '@/components/guest/chipStyles'
import RatingForm from './RatingForm'
import StarRating from './StarRating'
import ReviewItem from './reviews/ReviewItem'
import ReviewSummaryCard from './reviews/ReviewSummaryCard'
import { useItemRatingStatus, type MyRating } from './useItemRatingStatus'

interface Props {
  itemId: number
  // The partner who owns the course: when they are signed in they can answer reviews here
  authorId?: number
  authorName?: string
  initialReviews: PdpReview[]
}

const STAR_FILTERS = [5, 4, 3, 2, 1]

export default function ReviewsSection({ itemId, authorId, authorName, initialReviews }: Props) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState(initialReviews)
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [stars, setStars] = useState<number | undefined>()
  const [withPhotos, setWithPhotos] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [editing, setEditing] = useState(false)
  const { checked, hasPurchased, myRating, saveRating } = useItemRatingStatus(itemId)
  const isPartner = Boolean(user && authorId && user.id === authorId)

  const reload = useCallback(() => {
    getReviews(itemId, { stars, photos: withPhotos }).then(setReviews)
    getReviewSummary(itemId).then(setSummary)
  }, [itemId, stars, withPhotos])

  useEffect(() => { reload() }, [reload])

  function handleSaved(saved: MyRating) {
    saveRating(saved)
    setEditing(false)
    reload()
  }

  function startEdit() {
    setEditing(true)
    setTimeout(() => document.getElementById('rating-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  const filtered = stars !== undefined || withPhotos
  const shown = showAll ? reviews : reviews.slice(0, REVIEWS_SHOWN_FIRST)

  return (
    <>
      <div id="rating-form-anchor" className="mb-6">
        {checked && hasPurchased && !myRating && !editing && <RatingForm itemId={itemId} onSaved={handleSaved} />}

        {editing && (
          <div>
            <RatingForm
              itemId={itemId}
              existingRating={myRating?.value}
              existingComment={myRating?.comment}
              existingScores={myRating?.scores}
              existingMedia={myRating?.media}
              onSaved={handleSaved}
            />
            <button type="button" onClick={() => setEditing(false)} className="mt-1.5 min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs text-subtle hover:text-ink">Hủy</button>
          </div>
        )}

        {checked && hasPurchased && myRating && !editing && (
          <div className="flex items-center gap-3 rounded-xl border border-green-line bg-green-soft px-4 py-3">
            <StarRating value={myRating.value} />
            <span className="flex-1 text-sm font-bold text-green-dark">Đánh giá của bạn</span>
            <button type="button" onClick={startEdit} className="min-h-11 cursor-pointer rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink">Sửa</button>
          </div>
        )}
      </div>

      {summary && <ReviewSummaryCard summary={summary} />}

      {(summary?.count ?? 0) > 0 && (
        <div className="mb-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Lọc đánh giá">
          <button type="button" aria-pressed={withPhotos} onClick={() => setWithPhotos(!withPhotos)} className={withPhotos ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>Có ảnh</button>
          {STAR_FILTERS.map(count => (
            <button key={count} type="button" aria-pressed={stars === count} onClick={() => setStars(stars === count ? undefined : count)} className={stars === count ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>
              {count} sao
            </button>
          ))}
        </div>
      )}

      {reviews.length > 0 ? (
        <>
          <div className="divide-y divide-line">
            {shown.map(review => (
              <ReviewItem key={review.id ?? review.user_id} review={review} itemId={itemId} partnerName={authorName} replyToken={isPartner ? user?.jwtToken : undefined} onChanged={reload} />
            ))}
          </div>
          {reviews.length > REVIEWS_SHOWN_FIRST && !showAll && (
            <div className="mt-4"><button type="button" className="btn btn--outline text-sm" onClick={() => setShowAll(true)}>Xem thêm {reviews.length - REVIEWS_SHOWN_FIRST} đánh giá</button></div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">{filtered ? 'Không có đánh giá nào khớp bộ lọc.' : 'Chưa có đánh giá nào.'}</p>
      )}
    </>
  )
}
