'use client'

import { RefreshIcon } from '@/components/icons'
import { GUEST_CHANGE_BUTTON } from './chipStyles'
import { openGuestSheet } from './guestLearnerStore'

// Opens the "who is this for" sheet again.
export default function GuestChangeButton() {
  return (
    <button type="button" onClick={openGuestSheet} title="Thay đổi" aria-label="Thay đổi" className={GUEST_CHANGE_BUTTON}>
      <RefreshIcon className="size-5" />
    </button>
  )
}
