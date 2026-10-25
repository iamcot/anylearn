'use client'

import { useCallback, useEffect, useState } from 'react'

const TICK_MS = 1000

export function useCountdown() {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setTimeout(() => setRemaining(seconds => seconds - 1), TICK_MS)
    return () => clearTimeout(timer)
  }, [remaining])

  const start = useCallback((seconds: number) => setRemaining(seconds), [])
  return { remaining, start }
}
