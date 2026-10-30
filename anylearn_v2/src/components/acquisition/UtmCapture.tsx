'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { API_BASE } from '@/lib/apiBase'
import { landingKey, nextAcquisition, readStoredAcquisition, readUtm, hasUtm, storeAcquisition } from '@/lib/acquisition/store'

/**
 * Remembers the first link with UTM parameters a browser arrived on (sent with the registration) and counts the arrival
 * once per session and source for "Nguồn khách" (plan 19.A4). Renders nothing.
 */
export default function UtmCapture() {
  const pathname = usePathname()
  useEffect(() => {
    const search = window.location.search
    const utm = readUtm(search)
    if (!hasUtm(utm)) return
    const stored = readStoredAcquisition()
    const next = nextAcquisition(stored, search, pathname, Date.now())
    if (next && next !== stored) storeAcquisition(next)
    const key = landingKey(utm)
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch {}
    fetch(`${API_BASE}/track/landing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(utm), keepalive: true }).catch(() => {})
  }, [pathname])
  return null
}
