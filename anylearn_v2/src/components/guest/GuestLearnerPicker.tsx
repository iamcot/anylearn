'use client'

import { useAuth } from '@/context/AuthContext'
import { useIsClient } from '@/components/useIsClient'
import { guestPeople, selectedGuestPerson, withSelected } from '@/lib/guest/guestLearners'
import { GUEST_CHIP_OFF, GUEST_CHIP_ON } from './chipStyles'
import GuestChangeButton from './GuestChangeButton'
import { getGuestStore, saveGuestStore } from './guestLearnerStore'
import { useGuestLearners } from './useGuestLearners'

// Course page, above "Đăng ký ngay": which child the visitor registers for, before they have an account. The choice
// is kept, and registering creates that child and picks it on the next step.
export default function GuestLearnerPicker() {
  const { user, isAuthLoading } = useAuth()
  const isClient = useIsClient()
  const store = useGuestLearners()
  const people = guestPeople(store).filter(person => person.localId)
  if (!isClient || isAuthLoading || user || people.length === 0) return null

  const selected = selectedGuestPerson(store)
  return (
    <div className="mb-3 text-left">
      <div className="mb-1.5 text-sm font-medium text-ink">Đăng ký cho</div>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Đăng ký cho">
        {people.map(person => {
          const active = selected?.key === person.key
          return (
            <button
              key={person.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => person.localId && saveGuestStore(withSelected(getGuestStore(), person.localId))}
              className={active ? GUEST_CHIP_ON : GUEST_CHIP_OFF}
            >
              {person.label}
            </button>
          )
        })}
        <GuestChangeButton />
      </div>
    </div>
  )
}
