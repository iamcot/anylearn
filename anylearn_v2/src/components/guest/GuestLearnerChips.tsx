'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useIsClient } from '@/components/useIsClient'
import { guestPeople, selectedGuestPerson, withSelected, type GuestPerson } from '@/lib/guest/guestLearners'
import { getGuestStore, openGuestSheet, saveGuestStore } from './guestLearnerStore'
import { useGuestLearners } from './useGuestLearners'

const AGE_APPLIED_KEY = 'anylearn.guestAgeApplied'

const CHIP_BASE = 'min-h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-4 text-sm font-medium'

function chipClass(active: boolean) {
  return `${CHIP_BASE} ${active ? 'border-blue bg-blue text-white' : 'border-line bg-white text-text hover:bg-blue-soft'}`
}

function alreadyApplied(): boolean {
  try {
    return sessionStorage.getItem(AGE_APPLIED_KEY) === '1'
  } catch {
    return true
  }
}

function markApplied() {
  try {
    sessionStorage.setItem(AGE_APPLIED_KEY, '1')
  } catch {}
}

interface Props {
  // The age filter currently in the search URL ('all' when none)
  activeAge: string
  onPickAge: (ageFilter: string | null) => void
}

// Search page: who the visitor is shopping for, one tap to filter by that age. Only for visitors who are not logged in
// (people with an account get this from their children, plan 04.1).
export default function GuestLearnerChips({ activeAge, onPickAge }: Props) {
  const { user, isAuthLoading } = useAuth()
  const isClient = useIsClient()
  const store = useGuestLearners()
  const people = guestPeople(store)
  const first = selectedGuestPerson(store)
  const applied = useRef(false)
  const visible = isClient && !isAuthLoading && !user

  // Once per tab: open the search already filtered to the age they told us. After that the chips are theirs to toggle.
  useEffect(() => {
    if (!visible || applied.current || !first || activeAge !== 'all' || alreadyApplied()) return
    applied.current = true
    markApplied()
    onPickAge(first.ageFilter)
  }, [visible, first, activeAge, onPickAge])

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
          <button key={person.key} type="button" aria-pressed={active} onClick={() => pick(person)} className={chipClass(active)}>
            {person.label}
          </button>
        )
      })}
      <button type="button" onClick={openGuestSheet} className={chipClass(false)}>
        {people.length > 0 ? 'Sửa' : 'Tìm cho ai?'}
      </button>
    </div>
  )
}
