'use client'

import { useSyncExternalStore } from 'react'
import { EMPTY_GUEST_STORE, type GuestLearnerStore } from '@/lib/guest/guestLearners'
import { getGuestStore, isGuestSheetOpen, subscribeGuestStore } from './guestLearnerStore'

export function useGuestLearners(): GuestLearnerStore {
  return useSyncExternalStore(subscribeGuestStore, getGuestStore, () => EMPTY_GUEST_STORE)
}

export function useGuestSheetOpen(): boolean {
  return useSyncExternalStore(subscribeGuestStore, isGuestSheetOpen, () => false)
}
