'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'

export interface MyRating { value: number; comment: string }

interface LoadedStatus {
  itemId: number
  token: string
  hasPurchased: boolean
  myRating: MyRating | null
}

function parseStatus(json: { resultCode?: number; data?: { has_purchased?: boolean; my_rating?: { value: number | string; comment?: string } | null } }) {
  if (json.resultCode !== 1 || !json.data) return { hasPurchased: false, myRating: null }
  const rating = json.data.my_rating
  return {
    hasPurchased: Boolean(json.data.has_purchased),
    myRating: rating ? { value: Number(rating.value), comment: rating.comment ?? '' } : null,
  }
}

// Purchase and rating status of the signed-in person for one item (fetched client-side, the server has no token).
export function useItemRatingStatus(itemId: number) {
  const { user } = useAuth()
  const token = user?.jwtToken ?? null
  const [loaded, setLoaded] = useState<LoadedStatus | null>(null)
  const [savedRating, setSavedRating] = useState<MyRating | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const finish = (status: { hasPurchased: boolean; myRating: MyRating | null }) => {
      if (!cancelled) setLoaded({ itemId, token, ...status })
    }
    fetch(`${API_BASE}/item/${itemId}/is-fav`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.json())
      .then(json => finish(parseStatus(json)))
      .catch(() => finish({ hasPurchased: false, myRating: null }))
    return () => { cancelled = true }
  }, [itemId, token])

  const ready = !token || (loaded?.itemId === itemId && loaded.token === token)
  const current = token && ready ? loaded : null
  return {
    checked: ready,
    hasPurchased: current?.hasPurchased ?? false,
    myRating: savedRating ?? current?.myRating ?? null,
    saveRating: setSavedRating,
  }
}
