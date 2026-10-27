'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getChatUnread } from '@/lib/api/chat'

/** Unread class chat messages for the "Cộng đồng" tab; counted again on every page change. */
export function useChatUnread() {
  const { token } = useAuth()
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getChatUnread(token).then(({ data }) => { if (!cancelled) setUnread(data?.unread ?? 0) })
    return () => { cancelled = true }
  }, [token, pathname])

  return token ? unread : 0
}
