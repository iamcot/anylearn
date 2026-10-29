'use client'

import { useEffect, useState } from 'react'
import { getQuizMe } from '@/lib/api/quiz'

/** The player's current Leo rank key (`dong`, `bac`…), so the shield Leo holds matches it; `dong` until it is known or when the quiz is closed to them. */
export function useMyRankKey(token: string): string {
  const [rankKey, setRankKey] = useState('dong')
  useEffect(() => {
    let alive = true
    getQuizMe(token).then(({ data }) => { if (alive && data?.profile?.rankKey) setRankKey(data.profile.rankKey) }).catch(() => {})
    return () => { alive = false }
  }, [token])
  return rankKey
}
