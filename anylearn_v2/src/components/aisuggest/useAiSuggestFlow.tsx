'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import ChildInterestsModal from '@/components/ChildInterestsModal'
import { getGuestStore, openGuestSheet } from '@/components/guest/guestLearnerStore'
import { AI_SUGGEST_PATH } from '@/config/aiSuggest'
import { useAuth } from '@/context/AuthContext'
import { getChildInterests, getMyInterests } from '@/lib/api'
import { isAiSuggestEnabled } from '@/lib/api/aiSuggest'
import { interestsOfGuest, selectedGuestPerson } from '@/lib/guest/guestLearners'

export interface AiLearner {
  id: number
  name: string
  self: boolean
}

type Asking = { id: number; name: string; self: boolean } | { guestKey: string; name: string }

/**
 * The start of the AI suggestions: asks the short interest survey once per learner (skippable), then opens the page.
 * `enabled` is false when the back office switched the feature off, so callers fall back to their old behaviour.
 * `learner` undefined: a logged-in person goes straight to the page, which picks the default learner.
 */
export function useAiSuggestFlow(learner?: AiLearner): { enabled: boolean; busy: boolean; start: () => void; modal: ReactNode } {
  const { token } = useAuth()
  const router = useRouter()
  const [enabled, setEnabled] = useState(false)
  const [asking, setAsking] = useState<Asking | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { isAiSuggestEnabled().then(setEnabled) }, [])

  const go = (id?: number) => router.push(id ? `${AI_SUGGEST_PATH}?learner=${id}` : AI_SUGGEST_PATH)

  async function start() {
    if (token) {
      if (!learner) return go()
      setBusy(true)
      const answers = learner.self ? await getMyInterests(token) : await getChildInterests(learner.id, token)
      setBusy(false)
      if (answers?.answered) return go(learner.id)
      return setAsking({ id: learner.id, name: learner.name, self: learner.self })
    }
    const person = selectedGuestPerson(getGuestStore())
    if (!person) return openGuestSheet()
    if (interestsOfGuest(getGuestStore(), person.key)) return go()
    setAsking({ guestKey: person.key, name: person.name })
  }

  const finishAsking = () => {
    const done = asking
    setAsking(null)
    if (done) go('id' in done ? done.id : undefined)
  }

  const modal = asking && (
    <ChildInterestsModal
      childId={'id' in asking ? asking.id : 0}
      childName={asking.name}
      token={token ?? undefined}
      isSelf={'id' in asking ? asking.self : asking.guestKey === 'self'}
      guestKey={'guestKey' in asking ? asking.guestKey : undefined}
      rememberSkip
      onClose={() => setAsking(null)}
      onSaved={finishAsking}
      onSkipped={finishAsking}
    />
  )
  return { enabled, busy, start: () => { void start() }, modal }
}
