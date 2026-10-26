'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useIsClient } from '@/components/useIsClient'
import { guestPeople, withSelected } from '@/lib/guest/guestLearners'
import { GUEST_CHIP_ON } from './chipStyles'
import GuestChangeButton from './GuestChangeButton'
import { getGuestStore, openGuestSheet, saveGuestStore } from './guestLearnerStore'
import { useGuestLearners } from './useGuestLearners'

// Home page, right under the search box (inside the hero): once a visitor told us who the courses are for, one tap
// opens the search for that age. Same light green chips as on the search and course pages.
export default function GuestLearnerStrip() {
  const { user, isAuthLoading } = useAuth()
  const isClient = useIsClient()
  const store = useGuestLearners()
  const people = guestPeople(store)
  if (!isClient || isAuthLoading || user) return null

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Khóa học theo người học">
      {people.map(person => (
        <Link
          key={person.key}
          href={`/search?age=${person.ageFilter}`}
          onClick={() => person.localId && saveGuestStore(withSelected(getGuestStore(), person.localId))}
          className={GUEST_CHIP_ON}
        >
          Gợi ý cho {person.label}
        </Link>
      ))}
      {store.audience
        ? <GuestChangeButton />
        : <button type="button" onClick={openGuestSheet} className={GUEST_CHIP_ON}>Tìm cho ai?</button>}
    </div>
  )
}
