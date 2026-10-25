'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useIsClient } from '@/components/useIsClient'
import { selectedGuestPerson } from '@/lib/guest/guestLearners'
import { ArrowRightIcon } from '@/components/icons'
import { openGuestSheet } from './guestLearnerStore'
import { useGuestLearners } from './useGuestLearners'

// Home page: once a visitor told us who the courses are for, one line takes them to the courses of that age.
export default function GuestLearnerStrip() {
  const { user, isAuthLoading } = useAuth()
  const isClient = useIsClient()
  const store = useGuestLearners()
  const person = selectedGuestPerson(store)
  if (!isClient || isAuthLoading || user || !person) return null

  return (
    <div className="border-b border-blue-line bg-blue-soft">
      <div className="container flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
        <Link href={`/search?age=${person.ageFilter}`} className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-blue no-underline">
          Khóa học hợp với {person.label} <ArrowRightIcon className="size-4" />
        </Link>
        <button type="button" onClick={openGuestSheet} className="min-h-11 cursor-pointer border-0 bg-transparent px-1 text-xs text-muted underline">
          Đổi
        </button>
      </div>
    </div>
  )
}
