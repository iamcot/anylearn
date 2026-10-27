'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { API_BASE } from '@/lib/apiBase'

/** Tells the server a signed-in person opened this course page (feeds the AI suggestions). Renders nothing, once per open. */
export default function TrackItemView({ itemId }: { itemId: number }) {
  const { token } = useAuth()
  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/item/${itemId}/view`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {})
  }, [itemId, token])
  return null
}
