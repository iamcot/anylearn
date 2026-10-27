'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import UpcomingEventsBar from './UpcomingEventsBar'
import { CartIcon, MenuIcon, SearchIcon } from './icons'
import AccountMenu from './header/AccountMenu'
import CountBadge from './header/CountBadge'
import MobileMenu from './header/MobileMenu'
import NotificationBell from './header/NotificationBell'
import { useNotifications } from './header/useNotifications'
import { ICON_BUTTON_CLASS, MEMBER_NAV_LINKS, NAV_LINKS, TODAY_NAV_LINKS } from './header/constants'
import { BROWSE_HOME_URL, markBrowsing } from '@/lib/today/links'
import { isNavActive } from '@/lib/today/nav'

export default function Header() {
  const pathname = usePathname()
  const isToday = pathname.startsWith('/today')
  const homeHref = isToday ? BROWSE_HOME_URL : '/'
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, cartCount, openAuthModal } = useAuth()
  const { unreadCount, setUnreadCount } = useNotifications()
  const navLinks = isToday ? TODAY_NAV_LINKS : user ? [...MEMBER_NAV_LINKS, ...NAV_LINKS] : NAV_LINKS
  const compactMobile = isToday || !!user

  const bell = user && <NotificationBell token={user.jwtToken} unreadCount={unreadCount} onUnreadChange={setUnreadCount} />

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-line/90 min-h-[76px]">
      <div className="container flex items-center justify-between gap-6 h-[76px]">

        <Link href={homeHref} onClick={isToday ? markBrowsing : undefined} className="flex items-center no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cdn/anylearn/img/LogoanyLEARN.svg" alt="anyLEARN" className="h-[60px]" />
        </Link>

        <nav className="hidden lg:flex gap-6 items-center">
          {navLinks.map(({ href, label }) => {
            const active = isToday && isNavActive(pathname, href)
            return (
              <Link key={label} href={href}
                aria-current={active ? 'page' : undefined}
                className={`font-extrabold text-[15px] no-underline py-2 border-b-2 transition-all duration-200 hover:text-blue hover:border-green ${active ? 'text-blue border-green' : 'text-text border-transparent'}`}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2.5">
          <Link href="/checkout" aria-label="Giỏ hàng" className={ICON_BUTTON_CLASS}>
            <CartIcon />
            <CountBadge count={cartCount} />
          </Link>

          {bell}

          {user
            ? <AccountMenu user={user} />
            : <button onClick={() => openAuthModal('login')} className="btn btn--blue py-2 px-4 text-sm">Đăng nhập</button>
          }
        </div>

        <div className="flex lg:hidden items-center gap-2">
          {compactMobile && (
            <Link href="/search" onClick={isToday ? markBrowsing : undefined} aria-label="Tìm khóa học"
              className={ICON_BUTTON_CLASS}><SearchIcon /></Link>
          )}
          <Link href="/checkout" aria-label="Giỏ hàng" className={ICON_BUTTON_CLASS}>
            <CartIcon />
            <CountBadge count={cartCount} />
          </Link>
          {bell}
          {!compactMobile && (
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu" aria-expanded={menuOpen}
              className={ICON_BUTTON_CLASS}><MenuIcon /></button>
          )}
        </div>
      </div>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </header>
    <UpcomingEventsBar />
    </>
  )
}
