'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ChildInterestsModal from '@/components/ChildInterestsModal'
import { getGuestStore, openGuestSheet } from '@/components/guest/guestLearnerStore'
import { useGuestLearners } from '@/components/guest/useGuestLearners'
import { useIsClient } from '@/components/useIsClient'
import LearnerChips from '@/components/today/LearnerChips'
import { AI_SUGGEST_PATH } from '@/config/aiSuggest'
import { useAuth } from '@/context/AuthContext'
import { getChildInterests, getMyInterests } from '@/lib/api'
import { isAiSuggestEnabled } from '@/lib/api/aiSuggest'
import { interestsOfGuest, selectedGuestPerson } from '@/lib/guest/guestLearners'
import { getLearners } from '@/lib/today/api'
import type { LearnerView } from '@/lib/today/types'

interface Props {
  // The learner chosen by the page (/today). Without it the card has its own picker.
  learner?: { id: number; name: string; self: boolean }
}

type Asking = { id: number; name: string; self: boolean } | { guestKey: string; name: string }

/** "Gợi ý khóa học bằng AI": asks the short interest survey once per learner (skippable), then opens the suggestions page. */
export default function AiSuggestEntry({ learner }: Props) {
  const { token, isAuthLoading } = useAuth()
  const router = useRouter()
  const isClient = useIsClient()
  const guestStore = useGuestLearners()
  const [enabled, setEnabled] = useState(false)
  const [learners, setLearners] = useState<LearnerView[]>([])
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [asking, setAsking] = useState<Asking | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { isAiSuggestEnabled().then(setEnabled) }, [])
  useEffect(() => {
    if (!token || learner) return
    let cancelled = false
    getLearners(token).then(({ data }) => { if (!cancelled && data) { setLearners(data.learners); setPickedId(data.defaultLearnerId) } })
    return () => { cancelled = true }
  }, [token, learner])

  if (!isClient || isAuthLoading || !enabled) return null

  const guest = token ? undefined : selectedGuestPerson(guestStore)
  const current = learner ?? learners.find(item => item.id === pickedId)
  const name = token ? (current ? (current.self ? 'bạn' : current.name) : '') : (guest ? (guest.name === 'Tôi' ? 'bạn' : guest.name) : '')

  const go = (id?: number) => router.push(id ? `${AI_SUGGEST_PATH}?learner=${id}` : AI_SUGGEST_PATH)

  async function start() {
    if (token) {
      if (!current) return
      setBusy(true)
      const answers = current.self ? await getMyInterests(token) : await getChildInterests(current.id, token)
      setBusy(false)
      if (answers?.answered) return go(current.id)
      return setAsking({ id: current.id, name: current.name, self: current.self })
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

  return (
    <section className="rounded-[20px] border border-green-line bg-gradient-to-br from-green-soft to-blue-soft p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="m-0 text-lg font-black text-ink"><span aria-hidden>✨ </span>Gợi ý khóa học bằng AI{name ? ` cho ${name}` : ''}</h2>
          <p className="m-0 mt-1 text-sm text-muted">Mỗi ngày một danh sách mới, chọn riêng theo độ tuổi, sở thích và lịch học.</p>
        </div>
        <button type="button" onClick={start} disabled={busy || (!!token && !current)} className="btn btn--green min-h-11 shrink-0 text-sm disabled:opacity-50">
          {busy ? 'Đang mở...' : 'Xem gợi ý'}
        </button>
      </div>
      {token && !learner && learners.length > 1 && pickedId != null && (
        <div className="mt-3"><LearnerChips learners={learners} selectedId={pickedId} onSelect={setPickedId} /></div>
      )}

      {asking && (
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
      )}
    </section>
  )
}
