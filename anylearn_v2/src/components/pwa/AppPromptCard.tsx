'use client'

import { useState } from 'react'
import EnablePushCard from './EnablePushCard'
import InstallAppCard from './InstallAppCard'
import { usePushPrompt } from './usePushPrompt'

type Context = 'today' | 'order'

// One card at a time: notifications first where the browser can receive them, otherwise the install card
// (on iPhone notifications only work inside the installed app, so installing comes first there).
export default function AppPromptCard({ context }: { context: Context }) {
  const push = usePushPrompt()
  // Keeps the push card (and its result message) on screen after the person answers.
  const [pushAnswered, setPushAnswered] = useState(false)

  if (push.mode === 'ask' || pushAnswered) {
    const tracked = { ...push, enable: async () => { setPushAnswered(true); return push.enable() } }
    return <EnablePushCard context={context} push={tracked} />
  }
  return <InstallAppCard context={context} />
}
