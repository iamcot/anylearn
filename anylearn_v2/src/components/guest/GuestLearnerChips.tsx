'use client'

import { useAuth } from '@/context/AuthContext'
import { useIsClient } from '@/components/useIsClient'
import { guestPeople, selectedGuestPerson, withSelected, type GuestPerson } from '@/lib/guest/guestLearners'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from './chipStyles'
import GuestChangeButton from './GuestChangeButton'
import { getGuestStore, openGuestSheet, saveGuestStore } from './guestLearnerStore'
import { useGuestLearners } from './useGuestLearners'

interface Props {
  // The age filter currently in the search URL ('all' when none)
  activeAge: string
  onPickAge: (ageFilter: string | null) => void
}

// Search page: who the visitor is shopping for, one tap to filter by that age (the first filter is applied by the page,
// see takeGuestAutoAge, so the search is not fetched twice). Only for visitors who are not logged in
// (people with an account get this from their children, plan 04.1).
export default function GuestLearnerChips({ activeAge, onPickAge }: Props) {
  const { user, isAuthLoading } = useAuth()
  const isClient = useIsClient()
  const store = useGuestLearners()
  const people = guestPeople(store)
  const visible = isClient && !isAuthLoading && !user

  if (!visible) return null

  const pick = (person: GuestPerson) => {
    if (person.localId) saveGuestStore(withSelected(getGuestStore(), person.localId))
    onPickAge(activeAge === person.ageFilter && selectedGuestPerson(getGuestStore())?.key === person.key ? null : person.ageFilter)
  }

  return (
    <div className="container flex items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Tìm cho ai">
      {people.map(person => {
        const active = activeAge === person.ageFilter && selectedGuestPerson(store)?.key === person.key
        return (
          <button key={person.key} type="button" aria-pressed={active} onClick={() => pick(person)} className={active ? GUEST_CHIP_ON : GUEST_CHIP_OFF}>
            {person.label}
          </button>
        )
      })}
      {store.audience
        ? <GuestChangeButton />
        : <button type="button" onClick={openGuestSheet} className={GUEST_CHIP_ON}>Tìm cho ai?</button>}
    </div>
  )
}
