'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'
import { HeartIcon } from '@/components/icons'

interface Props {
  itemId: number
  initialFaved: boolean
  initialCount: number
}

export default function FavButton({ itemId, initialFaved, initialCount }: Props) {
  const { user, openAuthModal } = useAuth()
  const [faved, setFaved] = useState(initialFaved)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  // Hydrate real fav state + count from server once user is known (server render can't access auth)
  useEffect(() => {
    if (!user) return
    fetch(`${API_BASE}/item/${itemId}/is-fav`, {
      headers: { Authorization: `Bearer ${user.jwtToken}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.resultCode === 1) {
          setFaved(json.data.is_fav)
          if (json.data.num_favorite != null) setCount(json.data.num_favorite)
        }
      })
      .catch(() => {})
  }, [itemId, user])

  async function toggle() {
    if (!user) { openAuthModal(); return }
    if (loading) return
    setLoading(true)
    const wasFaved = faved
    setFaved(!wasFaved)
    setCount(c => wasFaved ? Math.max(0, c - 1) : c + 1)
    try {
      const res = await fetch(`${API_BASE}/item/${itemId}/touch-fav`, {
        headers: { Authorization: `Bearer ${user.jwtToken}` },
      })
      const json = await res.json()
      if (json.resultCode === 1) {
        setFaved(json.data.faved)
        setCount(json.data.num_favorite)
      } else {
        setFaved(wasFaved)
        setCount(c => wasFaved ? c + 1 : Math.max(0, c - 1))
      }
    } catch {
      setFaved(wasFaved)
      setCount(c => wasFaved ? c + 1 : Math.max(0, c - 1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={faved ? 'Bỏ yêu thích' : 'Yêu thích'}
      aria-pressed={faved}
      className={`inline-flex min-h-11 items-center gap-1.5 border-0 bg-transparent px-1 text-[13px] font-medium text-red transition-opacity ${loading ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
    >
      <HeartIcon filled={faved} className="size-[18px]" />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
