'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import RatingForm from './RatingForm'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface MyRating { value: number; comment: string }

interface Props {
  itemId: number
  itemTitle: string
}

export default function OrderItemRating({ itemId, itemTitle }: Props) {
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'no_purchase' | 'not_rated' | 'rated'>('loading')
  const [myRating, setMyRating] = useState<MyRating | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) { setStatus('no_purchase'); return }
    fetch(`${API}/item/${itemId}/is-fav`, {
      headers: { Authorization: `Bearer ${user.jwtToken}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.resultCode !== 1) { setStatus('no_purchase'); return }
        const { has_purchased, my_rating } = json.data
        if (!has_purchased) { setStatus('no_purchase'); return }
        if (my_rating) {
          setMyRating({ value: Number(my_rating.value), comment: my_rating.comment ?? '' })
          setStatus('rated')
        } else {
          setStatus('not_rated')
        }
      })
      .catch(() => setStatus('no_purchase'))
  }, [itemId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSaved(saved: MyRating) {
    setMyRating(saved)
    setStatus('rated')
    setOpen(false)
  }

  if (status === 'loading' || status === 'no_purchase') return null

  if (status === 'not_rated') {
    return (
      <div className="mt-2">
        {open ? (
          <>
            <RatingForm itemId={itemId} onSaved={handleSaved} />
            <button onClick={() => setOpen(false)}
              style={{ fontSize: 12, color: '#9aa5b1', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0 }}>
              Hủy
            </button>
          </>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="text-xs font-bold text-[#00539b] bg-white border border-[#00539b] px-3 py-1 rounded-full cursor-pointer hover:bg-blue-50">
            ⭐ Đánh giá
          </button>
        )}
      </div>
    )
  }

  // status === 'rated'
  return (
    <div className="mt-2">
      {open ? (
        <>
          <RatingForm
            itemId={itemId}
            existingRating={myRating?.value}
            existingComment={myRating?.comment}
            onSaved={handleSaved}
          />
          <button onClick={() => setOpen(false)}
            style={{ fontSize: 12, color: '#9aa5b1', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0 }}>
            Hủy
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13, color: '#f5a623' }}>
            {'★'.repeat(myRating?.value ?? 0)}{'☆'.repeat(5 - (myRating?.value ?? 0))}
          </span>
          <button
            onClick={() => setOpen(true)}
            style={{ fontSize: 11, color: '#00539b', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
            Sửa
          </button>
        </div>
      )}
    </div>
  )
}
