'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { ACCOUNT_MENU, NAV_LINKS } from './constants'

export default function MobileMenu({ onClose }: { onClose: () => void }) {
  const { user, logout, openAuthModal } = useAuth()

  return (
    <div className="border-t border-line px-5 py-4 flex flex-col gap-3 bg-white lg:hidden">
      {[...NAV_LINKS, { href: '/search', label: 'Tìm kiếm' }].map(({ href, label }) => (
        <Link key={label} href={href} onClick={onClose} className="font-extrabold text-text no-underline text-base">
          {label}
        </Link>
      ))}
      <div className="border-t border-line pt-3">
        {user ? (
          <div className="flex flex-col gap-1">
            {ACCOUNT_MENU.map(item => (
              <Link key={item.href} href={item.href} onClick={onClose} className="text-sm text-ink no-underline py-1.5">
                {item.label}
              </Link>
            ))}
            <button onClick={logout}
              className="border-0 bg-transparent text-red font-bold cursor-pointer font-[inherit] text-[15px] text-left mt-1">
              Đăng xuất
            </button>
          </div>
        ) : (
          <button onClick={() => { onClose(); openAuthModal('login') }} className="btn btn--blue w-full">Đăng nhập</button>
        )}
      </div>
    </div>
  )
}
