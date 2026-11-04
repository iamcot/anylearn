'use client'

import { useEffect } from 'react'
import { sendJourneyEvent, type JourneyEvent } from '@/lib/api/gamification'
import { nudgeJourneyClaim } from '@/lib/journey/store'

// Tells the server once per browser that the person did something only the app sees ("Gần tôi", comparing),
// so the journey mission can be paid. The server also keeps it once per account.
export function useJourneySignal(token: string | null | undefined, type: JourneyEvent, active: boolean) {
  useEffect(() => {
    if (!token || !active) return
    const key = `journey:signal:${type}`
    try { if (localStorage.getItem(key) === '1') return } catch { /* private mode */ }
    void sendJourneyEvent(token, type).then(() => {
      try { localStorage.setItem(key, '1') } catch { /* private mode */ }
      nudgeJourneyClaim()
    })
  }, [token, type, active])
}
