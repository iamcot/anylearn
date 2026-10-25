'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useIsClient } from '@/components/useIsClient'
import { guestPeople, withSelected } from '@/lib/guest/guestLearners'
import { getGuestStore, openGuestSheet, saveGuestStore } from './guestLearnerStore'
import { useGuestLearners } from './useGuestLearners'

const CHIP_CLASS = 'inline-flex min-h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border border-line bg-white px-4 text-sm font-medium text-ink no-underline hover:bg-blue-soft'

// Home page, right under the search box (inside the hero): once a visitor told us who the courses are for, one tap
// opens the search for that age. Same white bordered chips as on the search page.
export default function GuestLearnerStrip() {
  const { user, isAuthLoading } = useAuth()
  const isClient = useIsClient()
  const store = useGuestLearners()
  const people = guestPeople(store)
  if (!isClient || isAuthLoading || user || people.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Khóa học theo người học">
      <span className="mr-1 text-sm text-white/90">Gợi ý cho</span>
      {people.map(person => (
        <Link
          key={person.key}
          href={`/search?age=${person.ageFilter}`}
          onClick={() => person.localId && saveGuestStore(withSelected(getGuestStore(), person.localId))}
          className={CHIP_CLASS}
        >
          {person.label}
        </Link>
      ))}
      <button type="button" onClick={openGuestSheet} className={CHIP_CLASS}>Sửa</button>
    </div>
  )
}
