'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useIsClient } from '@/components/useIsClient'
import { PUSH_DISMISS_DAYS, PUSH_DISMISSED_KEY } from '@/config/pwa'
import type { PushServerInfo } from '@/lib/api'
import { pushPromptMode, type PushPromptMode } from '@/lib/pwa/push'
import { browserSupportsPush, currentPlatform, isStandalone, notificationPermission, readLocal, writeLocal } from './environment'
import { forgetPushDevice, isPushOptedOut, loadPushServerInfo, registerPushDevice } from './pushDevice'

export type EnableResult = 'enabled' | 'denied' | 'failed'

export interface PushPrompt {
  mode: PushPromptMode
  optedOut: boolean
  busy: boolean
  enable: () => Promise<EnableResult>
  disable: () => Promise<void>
  dismiss: () => void
}

export function usePushPrompt(): PushPrompt {
  const { token } = useAuth()
  const isClient = useIsClient()
  const [server, setServer] = useState<PushServerInfo | null>(null)
  // Bumped after every action so the mode is read again from the browser.
  const [, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const refresh = useCallback(() => setRevision(revision => revision + 1), [])

  useEffect(() => {
    let cancelled = false
    loadPushServerInfo().then(info => { if (!cancelled) setServer(info) })
    return () => { cancelled = true }
  }, [])

  const mode: PushPromptMode = !isClient || !server ? 'hidden' : pushPromptMode({
    serverEnabled: server.enabled,
    browserSupportsPush: browserSupportsPush(),
    permission: notificationPermission(),
    platform: currentPlatform(),
    standalone: isStandalone(),
    dismissedAt: readLocal(PUSH_DISMISSED_KEY),
    now: new Date(),
    dismissDays: PUSH_DISMISS_DAYS,
  })

  const enable = async (): Promise<EnableResult> => {
    if (!token || !server?.publicKey) return 'failed'
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return 'denied'
      return (await registerPushDevice(token, server.publicKey)) ? 'enabled' : 'failed'
    } finally {
      setBusy(false)
      refresh()
    }
  }

  const disable = async () => {
    if (!token) return
    setBusy(true)
    await forgetPushDevice(token, { optOut: true })
    setBusy(false)
    refresh()
  }

  const dismiss = () => {
    writeLocal(PUSH_DISMISSED_KEY, new Date().toISOString())
    refresh()
  }

  return { mode, optedOut: isClient && isPushOptedOut(), busy, enable, disable, dismiss }
}
