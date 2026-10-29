'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { phaseAt, type ArenaPhase, type ArenaTiming } from '@/lib/arena/timeline'

/**
 * The server's clock on this phone. `sync(serverNow)` is called whenever an answer from the server arrives (it sets the offset
 * server − phone); `now` is the server time, refreshed every `everyMs`. The phase comes from the timing alone, so a screen can
 * change at the right second without waiting for the next poll.
 */
export function useArenaClock(timing: ArenaTiming | null, everyMs = 250) {
  const offset = useRef(0)
  const [now, setNow] = useState(() => Date.now())

  const sync = useCallback((serverNow: number) => {
    offset.current = serverNow - Date.now()
    setNow(Date.now() + offset.current)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset.current), everyMs)
    return () => clearInterval(id)
  }, [everyMs])

  const phase: ArenaPhase | null = timing ? phaseAt(timing, now) : null
  return { now, phase, sync }
}
