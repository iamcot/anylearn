'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface Props {
  itemId: number
  initialFaved: boolean
  initialCount: number
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#e73348' : 'none'}
      stroke="#e73348" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export default function FavButton({ itemId, initialFaved, initialCount }: Props) {
  const { user, openAuthModal } = useAuth()
  const [faved, setFaved] = useState(initialFaved)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  // Hydrate real fav state + count from server once user is known (server render can't access auth)
  useEffect(() => {
    if (!user) return
    fetch(`${API}/item/${itemId}/is-fav`, {
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
      const res = await fetch(`${API}/item/${itemId}/touch-fav`, {
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
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'transparent', border: 'none',
        padding: '4px 2px',
        cursor: loading ? 'default' : 'pointer',
        fontSize: 13, fontWeight: 700,
        color: '#e73348',
        opacity: loading ? 0.6 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <HeartIcon filled={faved} />
      {count > 0 && <span style={{ fontSize: 13 }}>{count}</span>}
    </button>
  )
}
