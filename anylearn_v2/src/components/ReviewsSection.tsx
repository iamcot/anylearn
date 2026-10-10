'use client'

import { useState, useEffect } from 'react'
import type { PdpReview } from '@/lib/api'
import ReviewsList from './ReviewsList'
import RatingForm from './RatingForm'
import { useAuth } from '@/context/AuthContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

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
    fetch(`${API}/item/${itemId}/is-fav`, {
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
  }, [itemId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Always fetch fresh reviews on mount
  useEffect(() => {
    fetch(`${API}/item/${itemId}/reviews`)
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
  }, [itemId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshReviews() {
    const res = await fetch(`${API}/item/${itemId}/reviews`).catch(() => null)
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
              onClick={() => setEditing(false)}
              style={{ fontSize: 12, color: '#9aa5b1', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, padding: 0 }}
            >
              Hủy
            </button>
          </div>
        )}

        {/* Already rated — show summary + edit button */}
        {checked && hasPurchased && myRating && !editing && (
          <div className="flex items-center gap-3 rounded-[12px] bg-[#f0fff8] border border-[#c3f0d8] px-4 py-3">
            <span style={{ fontSize: 14, color: '#f5a623' }}>
              {'★'.repeat(myRating.value)}{'☆'.repeat(5 - myRating.value)}
            </span>
            <span className="text-sm text-[#008244] font-bold flex-1">Đánh giá của bạn</span>
            <button
              onClick={startEdit}
              style={{ fontSize: 12, color: '#00539b', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, border: '1px solid #00539b' } as React.CSSProperties}
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
