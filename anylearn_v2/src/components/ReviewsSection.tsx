'use client'

import { useState, useEffect } from 'react'
import type { PdpReview } from '@/lib/api'
import ReviewsList from './ReviewsList'
import RatingForm from './RatingForm'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'
import StarRating from './StarRating'

interface MyRating { value: number; comment: string }

interface Props {
  itemId: number
  initialReviews: PdpReview[]
  initialRating?: number
}

export default function ReviewsSection({ itemId, initialReviews, initialRating }: Props) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState(initialReviews)
  const [rating, setRating] = useState(initialRating)

  // User purchase/rating status (fetched client-side — server has no auth token)
  const [checked, setChecked] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [myRating, setMyRating] = useState<MyRating | null>(null)

  const [editing, setEditing] = useState(false)

  // Fetch user status
  useEffect(() => {
    if (!user) { setChecked(true); return }
    fetch(`${API_BASE}/item/${itemId}/is-fav`, {
      headers: { Authorization: `Bearer ${user.jwtToken}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.resultCode === 1) {
          setHasPurchased(json.data.has_purchased)
          const mr = json.data.my_rating
          setMyRating(mr ? { value: Number(mr.value), comment: mr.comment ?? '' } : null)
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [itemId, user])

  // Always fetch fresh reviews on mount
  useEffect(() => {
    fetch(`${API_BASE}/item/${itemId}/reviews`)
      .then(r => r.json())
      .then(json => {
        if (json.resultCode === 1 && Array.isArray(json.data)) {
          const fresh: PdpReview[] = json.data
          setReviews(fresh)
          if (fresh.length > 0)
            setRating(fresh.reduce((s, r) => s + Number(r.value), 0) / fresh.length)
        }
      })
      .catch(() => {})
  }, [itemId])

  async function refreshReviews() {
    const res = await fetch(`${API_BASE}/item/${itemId}/reviews`).catch(() => null)
    if (!res) return
    const json = await res.json()
    if (json.resultCode === 1 && Array.isArray(json.data)) {
      const fresh: PdpReview[] = json.data
      setReviews(fresh)
      if (fresh.length > 0)
        setRating(fresh.reduce((s, r) => s + Number(r.value), 0) / fresh.length)
    }
  }

  function handleSaved(saved: MyRating) {
    setMyRating(saved)
    setEditing(false)
    refreshReviews()
  }

  function startEdit() {
    setEditing(true)
    setTimeout(() => {
      document.getElementById('rating-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  return (
    <>
      <div id="rating-form-anchor" className="mb-6">
        {/* New review: purchased, not yet rated, not editing */}
        {checked && hasPurchased && !myRating && !editing && (
          <RatingForm itemId={itemId} onSaved={handleSaved} />
        )}

        {/* Edit form */}
        {editing && (
          <div>
            <RatingForm
              itemId={itemId}
              existingRating={myRating?.value}
              existingComment={myRating?.comment}
              onSaved={handleSaved}
            />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="mt-1.5 min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs text-subtle hover:text-ink"
            >
              Hủy
            </button>
          </div>
        )}

        {/* Already rated — show summary + edit button */}
        {checked && hasPurchased && myRating && !editing && (
          <div className="flex items-center gap-3 rounded-xl border border-green-line bg-green-soft px-4 py-3">
            <StarRating value={myRating.value} />
            <span className="flex-1 text-sm font-bold text-green-dark">Đánh giá của bạn</span>
            <button
              type="button"
              onClick={startEdit}
              className="min-h-11 cursor-pointer rounded-lg border border-blue bg-transparent px-3 text-xs font-medium text-blue"
            >
              Sửa
            </button>
          </div>
        )}
      </div>

      {reviews.length > 0
        ? <ReviewsList reviews={reviews} rating={rating} />
        : <p className="text-muted text-sm">Chưa có đánh giá nào.</p>
      }
    </>
  )
}
