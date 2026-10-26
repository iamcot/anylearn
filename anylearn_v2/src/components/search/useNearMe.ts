'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getHomePoint } from '@/lib/api'

export type NearPoint = { lat: number; lng: number }
export type NearStatus = 'idle' | 'locating' | 'no-position'

// About 100 m: precise enough for "near me", and a shared link does not carry an exact home position.
const round = (value: number) => Math.round(value * 1000) / 1000

function browserPosition(): Promise<NearPoint | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null)
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({ lat: round(position.coords.latitude), lng: round(position.coords.longitude) }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
  })
}

// "Gần tôi": the browser position; when it is refused, the address saved in the account; otherwise `no-position`
// and the page asks for a district.
export function useNearMe() {
  const { token } = useAuth()
  const [status, setStatus] = useState<NearStatus>('idle')

  const locate = useCallback(async (): Promise<NearPoint | null> => {
    setStatus('locating')
    const position = await browserPosition()
    if (position) {
      setStatus('idle')
      return position
    }
    const saved = token ? await getHomePoint(token) : null
    if (saved) {
      setStatus('idle')
      return { lat: round(saved.lat), lng: round(saved.lng) }
    }
    setStatus('no-position')
    return null
  }, [token])

  return { status, locate, clearStatus: () => setStatus('idle') }
}
