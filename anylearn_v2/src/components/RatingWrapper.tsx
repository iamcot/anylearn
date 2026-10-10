'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import RatingForm from './RatingForm'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

export interface MyRating { value: number; comment: string }

interface Props {
  itemId: number
  onSaved?: (myRating: MyRating) => void
  onStatus?: (hasPurchased: boolean, myRating: MyRating | null) => void
  initialRating?: number
  initialComment?: string
}

export default function RatingWrapper({ itemId, onSaved, onStatus, initialRating, initialComment }: Props) {
  const { user } = useAuth()
  const [hasPurchased, setHasPurchased] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!user) { setChecked(true); onStatus?.(false, null); return }
    fetch(`${API}/item/${itemId}/is-fav`, {
      headers: { Authorization: `Bearer ${user.jwtToken}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.resultCode === 1) {
          const hp: boolean = json.data.has_purchased
          const mr: MyRating | null = json.data.my_rating ?? null
          setHasPurchased(hp)
          onStatus?.(hp, mr)
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [itemId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!checked || !hasPurchased) return null
  return (
    <div className="mb-6">
      <RatingForm
        itemId={itemId}
        existingRating={initialRating}
        existingComment={initialComment}
        onSaved={onSaved}
      />
    </div>
  )
}
