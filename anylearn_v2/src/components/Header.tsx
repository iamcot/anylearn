'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import NotificationDropdown from './NotificationDropdown'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

const NAV_LINKS = [
  { href: '/info', label: 'Giới thiệu' },
  { href: '/search?mode=school', label: 'anySCHOOL' },
  { href: '/search?mode=teacher', label: 'anyPROFESSOR' },
  { href: '/search', label: 'Tìm kiếm' },
]

const ACCOUNT_MENU = [
  { href: '/account/profile', label: 'Thông tin cá nhân' },
  { href: '/account/children', label: 'Tài khoản của con' },
  { href: '/account/orders', label: 'Đơn hàng của tôi' },
  { href: '/account/schedule', label: 'Lịch học' },
  { href: '/account/course-codes', label: 'Mã code khóa học' },
  { href: '/account/change-password', label: 'Đổi mật khẩu' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user, cartCount, logout, openAuthModal, refreshUser } = useAuth()
  const accountRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`${API_BASE}/user/notification?page=0`, {
        headers: { Authorization: `Bearer ${user.jwtToken}` },
      })
      const json = await res.json()
      setUnreadCount(json?.data?.unread ?? 0)
    } catch {}
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
      try {
        const res = await fetch(`${API_BASE}/user/notification?page=0`, {
          headers: { Authorization: `Bearer ${user.jwtToken}` },
        })
        const json = await res.json()
        const count = json?.data?.unread ?? 0
        setUnreadCount(count)

        // Refresh wallet_c and user profile so anyPoint balance is up to date
        refreshUser()

        // Browser push notification
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            const latest = json?.data?.items?.find(
              (n: { read?: string | null; type?: string }) =>
                !n.read && n.type !== 'sms' && n.type !== 'zalo'
            )
            if (latest) {
              const opts = {
                body: latest.content as string,
                icon: `${window.location.origin}/favicon-16x16.png`,
                tag: `notif-${latest.id}`,
                requireInteraction: true,
                data: { url: `${window.location.origin}/` },
              }
              try {
                const reg = await navigator.serviceWorker?.ready
                if (reg) {
                  await reg.showNotification(latest.title || 'anyLEARN', opts)
                } else {
                  new Notification(latest.title || 'anyLEARN', opts)
                }
              } catch {
                new Notification(latest.title || 'anyLEARN', opts)
              }
            }
          }
        }
      } catch {}
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

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-line/90 min-h-[76px]">
      <div className="container flex items-center justify-between gap-6 h-[76px]">

        {/* Logo */}
        <Link href="/" className="flex items-center no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cdn/anylearn/img/LogoanyLEARN.svg" alt="anyLEARN" className="h-[60px]" />
        </Link>

        {/* Nav links */}
        <nav className="hidden-mobile flex gap-6 items-center">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={label} href={href}
              className="font-extrabold text-[#4d5968] text-[15px] no-underline py-2 border-b-2 border-transparent transition-all duration-200 hover:text-blue hover:border-green">
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden-mobile flex items-center gap-2.5">
          {/* Cart */}
          <Link href="/checkout" className="relative no-underline">
            <button className="w-[38px] h-[38px] rounded-full border border-line bg-white grid place-items-center cursor-pointer text-lg">🛒</button>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red text-white text-[11px] font-black grid place-items-center px-1">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Notification bell */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(v => !v); setAccountOpen(false) }}
                className="w-[38px] h-[38px] rounded-full border border-line bg-white grid place-items-center cursor-pointer text-lg relative">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red text-white text-[11px] font-black grid place-items-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationDropdown
                  token={user.jwtToken}
                  onClose={() => setNotifOpen(false)}
                  onUnreadChange={setUnreadCount}
                />
              )}
            </div>
          )}

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
                    <span className="text-base">🟡</span>
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
        <div className="show-mobile hidden items-center gap-2">
          {/* Cart on mobile */}
          <Link href="/checkout" className="relative no-underline">
            <button className="w-[38px] h-[38px] rounded-full border border-line bg-white grid place-items-center cursor-pointer text-lg">🛒</button>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red text-white text-[11px] font-black grid place-items-center px-1">
                {cartCount}
              </span>
            )}
          </Link>
          {/* Bell on mobile */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(v => !v); setAccountOpen(false) }}
                className="w-[38px] h-[38px] rounded-full border border-line bg-white grid place-items-center cursor-pointer text-lg relative">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red text-white text-[11px] font-black grid place-items-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationDropdown
                  token={user.jwtToken}
                  onClose={() => setNotifOpen(false)}
                  onUnreadChange={setUnreadCount}
                />
              )}
            </div>
          )}
          {/* Hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-[38px] h-[38px] rounded-[10px] border border-line bg-white flex items-center justify-center cursor-pointer text-xl"
            aria-label="Mở menu">☰</button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-line px-5 py-4 flex flex-col gap-3 bg-white">
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

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
