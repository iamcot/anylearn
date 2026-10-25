'use client'

import { useSyncExternalStore } from 'react'
import { LAST_PHONE_STORAGE_KEY } from '@/config/auth'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function readPhone(): string {
  try {
    return localStorage.getItem(LAST_PHONE_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

// The phone used for the last login; empty on the server so the first render matches.
export function useRememberedPhone(): string {
  return useSyncExternalStore(subscribe, readPhone, () => '')
}

export function rememberPhone(phone: string) {
  try {
    localStorage.setItem(LAST_PHONE_STORAGE_KEY, phone)
  } catch {}
}
