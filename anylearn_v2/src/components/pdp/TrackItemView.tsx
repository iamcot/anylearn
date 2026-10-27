'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'

/**
 * Counts one open of the course page (the server render cannot: it fetches the course twice and has no token).
 * Waits for the sign-in state so a signed-in person is counted once with their account, and not again on re-render
 * or in React strict mode.
 */
export default function TrackItemView({ itemId }: { itemId: number }) {
  const { token, isAuthLoading } = useAuth()
  useEffect(() => {
    if (isAuthLoading) return
    const key = `viewed:${itemId}`
    try {
      if (sessionStorage.getItem(key) && Date.now() - Number(sessionStorage.getItem(key)) < 30 * 60 * 1000) return
      sessionStorage.setItem(key, String(Date.now()))
    } catch { /* private mode: count anyway */ }
    fetch(`${API_BASE}/item/${itemId}/view`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      keepalive: true,
    }).catch(() => {})
  }, [itemId, token, isAuthLoading])
  return null
}
