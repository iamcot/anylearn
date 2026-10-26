'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getHomePoint } from '@/lib/api'
import { selectedGuestPerson } from '@/lib/guest/guestLearners'
import type { HomeContext } from '@/lib/home/blocks'
import { ALL_LEARNERS, readActiveLearner, subscribeActiveLearner, type LearnerChip } from '@/lib/search/learners'
import { useLearnerChips } from '@/components/search/LearnerChips'
import { useGuestLearners } from '@/components/guest/useGuestLearners'

export interface HomeState {
  ready: boolean
  chips: LearnerChip[]
  activeKey: string | undefined
  context: HomeContext
}

// The chip an account chose ("all" = nobody); with nothing chosen yet the first child is used.
export function pickActiveChip(chips: LearnerChip[], remembered: string | null): LearnerChip | undefined {
  if (remembered === ALL_LEARNERS) return undefined
  return chips.find(chip => chip.key === remembered) ?? chips[0]
}

// What the personal blocks of the home page know about the visitor: who the courses are for and, for an account
// with a saved address, where "near me" is.
export function useHomeContext(): HomeState {
  const { token, isAuthLoading } = useAuth()
  const chips = useLearnerChips()
  const remembered = useSyncExternalStore(subscribeActiveLearner, readActiveLearner, () => null)
  const guestStore = useGuestLearners()
  const [home, setHome] = useState<{ token: string; point: { lat: number; lng: number } | null } | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getHomePoint(token).then(point => { if (!cancelled) setHome({ token, point }) })
    return () => { cancelled = true }
  }, [token])

  const near = token && home?.token === token ? home.point ?? undefined : undefined

  if (token) {
    const chip = pickActiveChip(chips, remembered)
    const learner = chip ? { name: chip.name === 'Tôi' ? 'bạn' : chip.name, chipKey: chip.key, ageFrom: chip.ageFrom, ageTo: chip.ageTo } : undefined
    return { ready: !isAuthLoading, chips, activeKey: chip?.key, context: { learner, near } }
  }
  const guest = selectedGuestPerson(guestStore)
  const learner = guest ? { name: guest.name === 'Tôi' ? 'bạn' : guest.name, ageBucket: guest.ageFilter } : undefined
  return { ready: !isAuthLoading, chips: [], activeKey: undefined, context: { learner } }
}
