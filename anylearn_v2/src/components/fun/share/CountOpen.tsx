'use client'

import { useEffect } from 'react'
import { countAchievementOpen } from '@/lib/api/achievements'

/** Counts one open of a share page per browser and banner. */
export default function CountOpen({ token }: { token: string }) {
  useEffect(() => {
    const key = `ach-open:${token}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {}
    countAchievementOpen(token)
  }, [token])
  return null
}
