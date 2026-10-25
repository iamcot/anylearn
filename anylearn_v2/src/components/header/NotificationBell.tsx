'use client'

import { useCallback, useState } from 'react'
import NotificationDropdown from '@/components/NotificationDropdown'
import { BellIcon } from '@/components/icons'
import CountBadge from './CountBadge'
import { ICON_BUTTON_CLASS } from './constants'

interface Props {
  token: string
  unreadCount: number
  onUnreadChange: (count: number) => void
}

export default function NotificationBell({ token, unreadCount, onUnreadChange }: Props) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <div className="relative">
      <button type="button" aria-label="Thông báo" onClick={() => setOpen(value => !value)} className={ICON_BUTTON_CLASS}>
        <BellIcon />
        <CountBadge count={unreadCount} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <NotificationDropdown token={token} onClose={close} onUnreadChange={onUnreadChange} />
        </>
      )}
    </div>
  )
}
