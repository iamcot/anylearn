'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import NotificationDropdown from './NotificationDropdown'
import UpcomingEventsBar from './UpcomingEventsBar'
import { BellIcon, CartIcon, CoinIcon, MenuIcon, SearchIcon } from './icons'
import { getNotifications } from '@/lib/api'
import { BROWSE_HOME_URL, markBrowsing } from '@/lib/today/links'
import { TODAY_NAV, isNavActive } from '@/lib/today/nav'
import { API_BASE } from '@/lib/apiBase'

const NAV_LINKS = [
  { href: '/info', label: 'Giới thiệu' },
  { href: '/search?mode=school', label: 'anySCHOOL' },
  { href: '/search?mode=teacher', label: 'anyPROFESSOR' },
  { href: '/search', label: 'Tìm kiếm' },
]

const TODAY_NAV_LINKS = TODAY_NAV.filter(item => item.inHeader)

const ACCOUNT_MENU = [
  { href: '/today', label: 'Hôm nay' },
  { href: '/account/profile', label: 'Thông tin cá nhân' },
  { href: '/account/children', label: 'Tài khoản của con' },
  { href: '/account/orders', label: 'Đơn hàng của tôi' },
  { href: '/account/favorites', label: 'Yêu thích' },
  { href: '/account/schedule', label: 'Lịch học' },
  { href: '/account/course-codes', label: 'Mã code khóa học' },
  { href: '/account/change-password', label: 'Đổi mật khẩu' },
]

const ICON_BUTTON_CLASS = 'relative grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink no-underline lg:size-[38px]'

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red px-1 text-[11px] font-black text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function Header() {
  const pathname = usePathname()
  const isToday = pathname.startsWith('/today')
  const navLinks = isToday ? TODAY_NAV_LINKS : NAV_LINKS
  const homeHref = isToday ? BROWSE_HOME_URL : '/'
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, cartCount, logout, openAuthModal, refreshUser } = useAuth()
  const compactMobile = isToday || !!user
  const accountRef = useRef<HTMLDivElement>(null)
  const closeNotif = useCallback(() => setNotifOpen(false), [])

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    const { unread } = await getNotifications(user.jwtToken)
    setUnreadCount(unread ?? 0)
  }, [user])

  // Register service worker for reliable browser notifications (Chrome requires this)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Request browser notification permission when user logs in
  useEffect(() => {
    if (!user) return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [user])

  // SSE for real-time notifications + browser push
  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    fetchUnreadCount()

    const es = new EventSource(`${API_BASE}/user/notification/stream?api_token=${user.apiToken}`)

    es.addEventListener('notification', async () => {
      const result = await getNotifications(user.jwtToken)
      setUnreadCount(result.unread ?? 0)

      // Refresh wallet_c and user profile so anyPoint balance is up to date
      refreshUser()

      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const latest = result.items.find(n => !n.read && n.type !== 'sms' && n.type !== 'zalo')
      if (!latest) return
      const opts = {
        body: latest.content,
        icon: `${window.location.origin}/favicon-16x16.png`,
        tag: `notif-${latest.id}`,
        requireInteraction: true,
        data: { url: `${window.location.origin}/` },
      }
      try {
        const reg = await navigator.serviceWorker?.ready
        if (reg) await reg.showNotification(latest.title || 'anyLEARN', opts)
        else new Notification(latest.title || 'anyLEARN', opts)
      } catch {
        new Notification(latest.title || 'anyLEARN', opts)
      }
    })

    return () => es.close()
  }, [user, fetchUnreadCount])

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const bell = user && (
    <div className="relative">
      <button type="button" aria-label="Thông báo" onClick={() => { setNotifOpen(v => !v); setAccountOpen(false) }}
        className={ICON_BUTTON_CLASS}>
        <BellIcon />
        <CountBadge count={unreadCount} />
      </button>
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeNotif} />
          <NotificationDropdown token={user.jwtToken} onClose={closeNotif} onUnreadChange={setUnreadCount} />
        </>
      )}
    </div>
  )

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-line/90 min-h-[76px]">
      <div className="container flex items-center justify-between gap-6 h-[76px]">

        {/* Logo */}
        <Link href={homeHref} onClick={isToday ? markBrowsing : undefined} className="flex items-center no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cdn/anylearn/img/LogoanyLEARN.svg" alt="anyLEARN" className="h-[60px]" />
        </Link>

        {/* Nav links */}
        <nav className="hidden lg:flex gap-6 items-center">
          {navLinks.map(({ href, label }) => (
            <Link key={label} href={href}
              aria-current={isToday && isNavActive(pathname, href) ? 'page' : undefined}
              className={`font-extrabold text-[15px] no-underline py-2 border-b-2 transition-all duration-200 hover:text-blue hover:border-green ${isToday && isNavActive(pathname, href) ? 'text-blue border-green' : 'text-[#4d5968] border-transparent'}`}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Link href="/checkout" aria-label="Giỏ hàng" className={ICON_BUTTON_CLASS}>
            <CartIcon />
            <CountBadge count={cartCount} />
          </Link>

          {bell}

          {/* Auth */}
          {user ? (
            <div className="relative" ref={accountRef}>
              {/* Avatar + name — click to open popup */}
              <button
                onClick={() => setAccountOpen(v => !v)}
                className="flex items-center gap-2 border-0 bg-transparent cursor-pointer p-1 rounded-xl hover:bg-bg transition-colors"
              >
                {user.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.image} alt={user.name} className="w-[34px] h-[34px] rounded-full object-cover border-2 border-line" />
                  : <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-blue to-green grid place-items-center text-white font-black text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                }
                <span className="font-bold text-ink text-sm max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                  {user.name}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${accountOpen ? 'rotate-180' : ''}`}>
                  <path d="M2 4l4 4 4-4" stroke="#6d7a8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown popup */}
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-line rounded-card shadow-[0_12px_40px_rgba(15,23,42,0.12)] overflow-hidden z-50">
                  {/* anyPoint — click to go to anypoint page */}
                  <Link
                    href="/account/anypoint"
                    onClick={() => setAccountOpen(false)}
                    className="px-4 py-3 flex items-center gap-2 bg-bg border-b border-line no-underline hover:bg-blue-soft transition-colors"
                  >
                    <CoinIcon className="size-5 text-yellow" />
                    <span className="text-xs text-muted">anyPoint:</span>
                    <span className="text-sm font-black text-ink">{(user.walletC ?? 0).toLocaleString()}</span>
                  </Link>

                  {/* Menu items */}
                  <div className="py-1">
                    {ACCOUNT_MENU.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-ink font-medium no-underline hover:bg-bg transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-line py-1">
                    <button
                      onClick={() => { logout(); setAccountOpen(false) }}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red font-bold border-0 bg-transparent cursor-pointer hover:bg-red-soft transition-colors text-left"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => openAuthModal('login')} className="btn btn--blue py-2 px-4 text-sm">
              Đăng nhập
            </button>
          )}
        </div>

        {/* Mobile toggle + icons */}
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-line px-5 py-4 flex flex-col gap-3 bg-white lg:hidden">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)}
              className="font-extrabold text-[#4d5968] no-underline text-base">
              {label}
            </Link>
          ))}
          <div className="border-t border-line pt-3">
            {user ? (
              <div className="flex flex-col gap-1">
                {ACCOUNT_MENU.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                    className="text-sm text-ink no-underline py-1.5">
                    {item.label}
                  </Link>
                ))}
                <button onClick={logout}
                  className="border-0 bg-transparent text-red font-bold cursor-pointer font-[inherit] text-[15px] text-left mt-1">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button onClick={() => { setMenuOpen(false); openAuthModal('login') }}
                className="btn btn--blue w-full">Đăng nhập</button>
            )}
          </div>
        </div>
      )}

    </header>
    <UpcomingEventsBar />
    </>
  )
}
