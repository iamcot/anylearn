'use client'

import { useEffect, useState } from 'react'
import { useGuestLearners } from '@/components/guest/useGuestLearners'
import { useIsClient } from '@/components/useIsClient'
import LearnerChips from '@/components/today/LearnerChips'
import { useAuth } from '@/context/AuthContext'
import { selectedGuestPerson } from '@/lib/guest/guestLearners'
import { getLearners } from '@/lib/today/api'
import type { LearnerView } from '@/lib/today/types'
import { useAiSuggestFlow, type AiLearner } from './useAiSuggestFlow'

interface Props {
  // The learner chosen by the page (/today). Without it the card has its own picker.
  learner?: AiLearner
}

/** "Gợi ý khóa học bằng AI" card of /today (the home page uses the "Thử điều mới" card instead). */
export default function AiSuggestEntry({ learner }: Props) {
  const { token, isAuthLoading } = useAuth()
  const isClient = useIsClient()
  const guestStore = useGuestLearners()
  const [learners, setLearners] = useState<LearnerView[]>([])
  const [pickedId, setPickedId] = useState<number | null>(null)

  useEffect(() => {
    if (!token || learner) return
    let cancelled = false
    getLearners(token).then(({ data }) => { if (!cancelled && data) { setLearners(data.learners); setPickedId(data.defaultLearnerId) } })
    return () => { cancelled = true }
  }, [token, learner])

  const current = learner ?? learners.find(item => item.id === pickedId)
  const { enabled, busy, start, modal } = useAiSuggestFlow(current ? { id: current.id, name: current.name, self: current.self } : undefined)

  if (!isClient || isAuthLoading || !enabled) return null

  const guest = token ? undefined : selectedGuestPerson(guestStore)
  const name = token ? (current ? (current.self ? 'bạn' : current.name) : '') : (guest ? (guest.name === 'Tôi' ? 'bạn' : guest.name) : '')

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
      {modal}
    </section>
  )
}
