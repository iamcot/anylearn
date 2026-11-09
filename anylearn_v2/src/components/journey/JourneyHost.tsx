'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { claimJourney, getJourney, sendJourneyEvent } from '@/lib/api/gamification'
import { claimDue } from '@/lib/journey/rules'
import { farmGift } from '@/lib/api/farm'
import { claimNudge, enqueueRewards, farmGiftNudge, journeyStore } from '@/lib/journey/store'

const PWA_KEY = 'journey:pwa-sent'

function standalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

// Mounted once in the root layout. On page changes (at most once a minute, or right away after a nudge) it asks the
// server to pay the journey missions that are done, queues what was paid for Leo's animation and keeps the journey
// in the store for the cards and Leo's guide. It also reports "opened as an installed app" once.
export default function JourneyHost() {
  const { token } = useAuth()
  const pathname = usePathname()
  const nudge = useSyncExternalStore(claimNudge.subscribe, claimNudge.get, () => 0)
  const giftNudge = useSyncExternalStore(farmGiftNudge.subscribe, farmGiftNudge.get, () => 0)
  const lastGiftNudge = useRef(0)
  const lastAt = useRef<number | null>(null)
  const lastNudge = useRef(0)

  useEffect(() => {
    if (!token) { journeyStore.set(null); lastAt.current = null; return }
    const forced = nudge !== lastNudge.current
    lastNudge.current = nudge
    if (!forced && !claimDue(lastAt.current, Date.now())) return
    lastAt.current = Date.now()
    let alive = true
    ;(async () => {
      try {
        if (standalone() && localStorage.getItem(PWA_KEY) !== '1') {
          await sendJourneyEvent(token, 'pwa_install')
          localStorage.setItem(PWA_KEY, '1')
        }
      } catch { /* storage blocked */ }
      const paid = await claimJourney(token)
      if (!alive) return
      enqueueRewards(paid.rewards, paid.coinName)
      const journey = await getJourney(token)
      if (alive && journey) journeyStore.set(journey)
    })()
    return () => { alive = false }
  }, [token, pathname, nudge])

  // Leo's farm gift: once per browser tab session after login, and again right after an order (nudge).
  useEffect(() => {
    if (!token) return
    const forced = giftNudge !== lastGiftNudge.current
    lastGiftNudge.current = giftNudge
    const key = 'farm-gift:asked'
    try { if (!forced && sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1') } catch { /* private mode */ }
    void farmGift(token).then(res => {
      if (res.data?.given) {
        enqueueRewards([{ kind: 'order', key: `farm-gift:${Date.now()}`, label: 'Leo có quà cho bạn!', extra: ['1 Hạt Tri thức cho Nông trại anyLEARN', 'Vào Vui học > Nông trại để gieo nhé'] }])
      }
    }).catch(() => { /* farm closed or off */ })
  }, [token, giftNudge])

  useEffect(() => {
    if (!token) return
    const onInstalled = () => { void sendJourneyEvent(token, 'pwa_install').then(() => { lastAt.current = null }) }
    window.addEventListener('appinstalled', onInstalled)
    return () => window.removeEventListener('appinstalled', onInstalled)
  }, [token])

  return null
}
