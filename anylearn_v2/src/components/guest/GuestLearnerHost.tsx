'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Modal from '@/components/Modal'
import { useIsClient } from '@/components/useIsClient'
import { GUEST_PROMPT_DISMISS_DAYS } from '@/config/guestLearners'
import { getChildren } from '@/lib/api'
import {
  EMPTY_GUEST_STORE, hasGuestLearners, matchGuestToChildren, selectedGuestLearner, shouldAskWhoFor, withoutLearners,
  type GuestLearner,
} from '@/lib/guest/guestLearners'
import GuestLearnerSheet from './GuestLearnerSheet'
import { getGuestStore, saveGuestStore, setPendingChildId } from './guestLearnerStore'
import { importGuestLearners } from './importGuestLearners'
import { useGuestLearners, useGuestSheetOpen } from './useGuestLearners'

const ASK_DELAY_MS = 1500

// Waits a moment so the question does not cover the page the instant it opens.
function useAfterDelay(active: boolean, ms: number): boolean {
  const [elapsed, setElapsed] = useState(false)
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setElapsed(true), ms)
    return () => clearTimeout(timer)
  }, [active, ms])
  return active && elapsed
}

function WhoForPrompt() {
  const { user, isAuthLoading, isAuthModalOpen } = useAuth()
  const pathname = usePathname()
  const isClient = useIsClient()
  const store = useGuestLearners()
  const explicitOpen = useGuestSheetOpen()
  const wantsToAsk = isClient && !isAuthLoading && !user && !isAuthModalOpen
    && shouldAskWhoFor(store, pathname, new Date(), GUEST_PROMPT_DISMISS_DAYS)
  const asking = useAfterDelay(wantsToAsk, ASK_DELAY_MS)
  const guestCanSee = isClient && !isAuthLoading && !user

  if (!guestCanSee || (!asking && !explicitOpen)) return null
  return <GuestLearnerSheet store={store} asking={asking && !explicitOpen} />
}

// After a login: the guest's children that already exist on the account are used as they are; the others are offered.
// (Registering creates them straight away in AuthContext.register, so only logins with leftovers get here.)
function LoginLeftovers() {
  const { token } = useAuth()
  const store = useGuestLearners()
  const [offer, setOffer] = useState<GuestLearner[]>([])
  const [busy, setBusy] = useState(false)
  const resolvedToken = useRef<string | null>(null)

  useEffect(() => {
    if (!token || resolvedToken.current === token) return
    if (!hasGuestLearners(store)) {
      // Nothing left to place: forget the rest of the guest answer (a shared phone must not keep it for the next visitor).
      if (store !== EMPTY_GUEST_STORE) saveGuestStore(EMPTY_GUEST_STORE)
      return
    }
    resolvedToken.current = token
    getChildren(token).then(children => {
      const { matched, unmatched } = matchGuestToChildren(store.learners, children)
      const chosen = selectedGuestLearner(store)
      const chosenMatch = matched.find(match => match.guest.localId === chosen?.localId)
      if (chosenMatch) setPendingChildId(chosenMatch.child.id)
      saveGuestStore(withoutLearners(getGuestStore(), matched.map(match => match.guest.localId)))
      setOffer(unmatched)
    })
  }, [token, store])

  if (offer.length === 0) return null

  const names = offer.map(learner => `${learner.nickname} (${learner.birthYear})`).join(', ')
  const skip = () => {
    saveGuestStore(EMPTY_GUEST_STORE)
    setOffer([])
  }
  const add = async () => {
    if (!token) return
    setBusy(true)
    await importGuestLearners(token, offer)
    saveGuestStore(EMPTY_GUEST_STORE)
    setBusy(false)
    setOffer([])
  }

  return (
    <Modal title="Thêm bé vào tài khoản?" onClose={skip}>
      <p className="m-0 mb-4 text-sm text-text">
        Bạn vừa cho anyLEARN biết bé {names}. Thêm vào tài khoản để chọn khi đăng ký khóa học?
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={skip} className="btn btn--outline min-h-11 flex-1 text-sm">Bỏ qua</button>
        <button type="button" onClick={add} disabled={busy} className="btn btn--green min-h-11 flex-1 text-sm disabled:opacity-60">
          {busy ? 'Đang thêm...' : 'Thêm'}
        </button>
      </div>
    </Modal>
  )
}

// Mounted once in the root layout.
export default function GuestLearnerHost() {
  return (
    <>
      <WhoForPrompt />
      <LoginLeftovers />
    </>
  )
}
