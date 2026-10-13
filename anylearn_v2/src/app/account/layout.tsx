'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useScrollEdges } from '@/lib/scrollEdges'

const NAV_ITEMS = [
  { href: '/account/anypoint', label: 'anyPoint', icon: '🟡', isPoint: true },
  { href: '/account/profile', label: 'Thông tin cá nhân', icon: '👤' },
  { href: '/account/schedule', label: 'Lịch học', icon: '📅' },
  { href: '/account/course-codes', label: 'Mã code khóa học', icon: '🔑' },
  { href: '/account/orders', label: 'Đơn hàng của tôi', icon: '📦' },
  { href: '/account/favorites', label: 'Yêu thích', icon: '❤️' },
  { href: '/account/children', label: 'Tài khoản của con', icon: '👶' },
  { href: '/account/change-password', label: 'Đổi mật khẩu', icon: '🔒' },
]

type NavItem = (typeof NAV_ITEMS)[number]

function PointBadge({ points, active }: { points: number; active: boolean }) {
  return (
    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${active ? 'bg-blue text-white' : 'bg-yellow/20 text-ink'}`}>
      {points.toLocaleString()}
    </span>
  )
}

function EdgeIndicator({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const isLeft = side === 'left'
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 z-10 flex w-12 items-center ${isLeft ? 'left-0 justify-start bg-gradient-to-r' : 'right-0 justify-end bg-gradient-to-l'} from-bg via-bg/80 to-transparent`}
    >
      <button
        type="button" onClick={onClick} aria-label={isLeft ? 'Cuộn sang trái' : 'Cuộn sang phải'}
        className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-line bg-white shadow-md cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={isLeft ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>
    </div>
  )
}

function MobileNav({ pathname, points, onLogout }: { pathname: string; points: number; onLogout: () => void }) {
  const activeRef = useRef<HTMLAnchorElement>(null)
  const { ref, edges, scrollByStep } = useScrollEdges<HTMLDivElement>()

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [pathname])

  return (
    <nav
      className="md:hidden sticky top-[76px] z-30 -mx-[14px] bg-bg/95 backdrop-blur-md py-2 border-b border-line"
      aria-label="Tài khoản"
    >
      <div className="relative">
        <div
          ref={ref}
          className="flex gap-2 overflow-x-scroll overscroll-x-contain px-[14px] snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_ITEMS.map((item: NavItem) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href} href={item.href} ref={active ? activeRef : undefined}
                aria-current={active ? 'page' : undefined}
                className={`snap-start shrink-0 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm no-underline whitespace-nowrap
                  ${active ? 'border-blue bg-blue text-white font-black' : 'border-line bg-white text-text font-bold'}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
                {'isPoint' in item && item.isPoint && <PointBadge points={points} active={active} />}
              </Link>
            )
          })}
          <button
            type="button" onClick={onLogout}
            className="snap-start shrink-0 inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-bold text-red whitespace-nowrap cursor-pointer"
          >
            <span aria-hidden="true">🚪</span> Đăng xuất
          </button>
        </div>
        {edges.canLeft && <EdgeIndicator side="left" onClick={() => scrollByStep(-1)} />}
        {edges.canRight && <EdgeIndicator side="right" onClick={() => scrollByStep(1)} />}
      </div>
    </nav>
  )
}

function DesktopSidebar({ pathname, user, onLogout }: {
  pathname: string
  user: NonNullable<ReturnType<typeof useAuth>['user']>
  onLogout: () => void
}) {
  return (
    <aside className="hidden md:block h-fit">
      <div className="bg-white border border-line rounded-card overflow-hidden sticky top-24">
        <div className="p-5 border-b border-line flex items-center gap-3">
          {user.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-line" />
            : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue to-green grid place-items-center text-white font-black text-lg shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
          }
          <div className="overflow-hidden">
            <div className="font-black text-ink text-sm truncate">{user.name}</div>
            <div className="text-xs text-muted truncate">{user.phone}</div>
          </div>
        </div>

        <nav className="py-2">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm no-underline transition-colors
                  ${active
                    ? 'bg-blue-soft text-blue font-bold border-l-[3px] border-blue'
                    : 'text-text hover:bg-bg font-medium border-l-[3px] border-transparent'
                  }`}>
                <span>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {'isPoint' in item && item.isPoint && <PointBadge points={user.walletC ?? 0} active={active} />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-line py-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red font-medium border-0 bg-transparent cursor-pointer hover:bg-red-soft transition-colors text-left">
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthLoading && !user) router.push('/login')
  }, [isAuthLoading, user, router])

  if (isAuthLoading || !user) return null

  const handleLogout = () => { logout(); router.push('/') }

  return (
    <div className="bg-bg min-h-[80vh] py-3 md:py-10">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-3 md:gap-6">
          <MobileNav pathname={pathname} points={user.walletC ?? 0} onLogout={handleLogout} />
          <DesktopSidebar pathname={pathname} user={user} onLogout={handleLogout} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
