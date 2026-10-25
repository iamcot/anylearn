'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { AuthUser } from '@/lib/api'
import { ChevronDownIcon, CoinIcon } from '@/components/icons'
import { ACCOUNT_MENU } from './constants'

export default function AccountMenu({ user }: { user: AuthUser }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(value => !value)}
        className="flex items-center gap-2 border-0 bg-transparent cursor-pointer p-1 rounded-xl hover:bg-bg transition-colors"
      >
        {user.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={user.image} alt={user.name} className="w-[34px] h-[34px] rounded-full object-cover border-2 border-line" />
          : <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-blue to-green grid place-items-center text-white font-extrabold text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
        }
        <span className="font-bold text-ink text-sm max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
          {user.name}
        </span>
        <ChevronDownIcon className={`size-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-line rounded-card shadow-raised overflow-hidden z-50">
          <Link
            href="/account/anypoint"
            onClick={() => setOpen(false)}
            className="px-4 py-3 flex items-center gap-2 bg-bg border-b border-line no-underline hover:bg-blue-soft transition-colors"
          >
            <CoinIcon className="size-5 text-yellow" />
            <span className="text-xs text-muted">anyPoint:</span>
            <span className="text-sm font-extrabold text-ink">{(user.walletC ?? 0).toLocaleString()}</span>
          </Link>

          <div className="py-1">
            {ACCOUNT_MENU.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center px-4 py-2.5 text-sm text-ink font-medium no-underline hover:bg-bg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-line py-1">
            <button
              onClick={() => { logout(); setOpen(false) }}
              className="w-full flex items-center px-4 py-2.5 text-sm text-red font-bold border-0 bg-transparent cursor-pointer hover:bg-red-soft transition-colors text-left"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
