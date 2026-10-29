'use client'

import { useCallback, useRef, useState } from 'react'
import NotificationDropdown from '@/components/NotificationDropdown'
import { BellIcon } from '@/components/icons'
import { useDismissOnOutside } from '@/components/useDismissOnOutside'
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
  const containerRef = useRef<HTMLDivElement>(null)
  useDismissOnOutside(containerRef, open, close)

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" aria-label="Thông báo" onClick={() => setOpen(value => !value)} className={ICON_BUTTON_CLASS}>
        <BellIcon />
        <CountBadge count={unreadCount} className="right-0.5 top-0.5" />
      </button>
      {open && <NotificationDropdown token={token} onClose={close} onUnreadChange={onUnreadChange} />}
    </div>
  )
}
