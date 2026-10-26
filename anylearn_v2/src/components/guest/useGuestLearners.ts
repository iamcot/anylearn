'use client'

import { useSyncExternalStore } from 'react'
import { EMPTY_GUEST_STORE, type GuestLearnerStore } from '@/lib/guest/guestLearners'
import { getChildrenVersion, getGuestStore, isGuestSheetOpen, subscribeGuestStore } from './guestLearnerStore'

export function useGuestLearners(): GuestLearnerStore {
  return useSyncExternalStore(subscribeGuestStore, getGuestStore, () => EMPTY_GUEST_STORE)
}

export function useChildrenVersion(): number {
  return useSyncExternalStore(subscribeGuestStore, getChildrenVersion, () => 0)
}

export function useGuestSheetOpen(): boolean {
  return useSyncExternalStore(subscribeGuestStore, isGuestSheetOpen, () => false)
}
