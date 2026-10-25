'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, type ComponentType, type SVGProps } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useScrollEdges } from '@/lib/scrollEdges'
import { ListSkeleton } from '@/components/PageSkeleton'
import PendingOrdersCard from '@/components/orders/PendingOrdersCard'
import { usePendingOrders } from '@/components/orders/usePendingOrders'
import {
  BellIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CoinIcon, HeartIcon, KeyIcon, LockIcon, LogoutIcon, PackageIcon, UserIcon, UsersIcon,
} from '@/components/icons'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>
interface NavItem { href: string; label: string; Icon: IconComponent; isPoint?: boolean }

const NAV_ITEMS: NavItem[] = [
  { href: '/account/anypoint', label: 'anyPoint', Icon: CoinIcon, isPoint: true },
  { href: '/account/profile', label: 'Thông tin cá nhân', Icon: UserIcon },
  { href: '/account/schedule', label: 'Lịch học', Icon: CalendarIcon },
  { href: '/account/course-codes', label: 'Mã code khóa học', Icon: KeyIcon },
  { href: '/account/orders', label: 'Đơn hàng của tôi', Icon: PackageIcon },
  { href: '/account/favorites', label: 'Yêu thích', Icon: HeartIcon },
  { href: '/account/children', label: 'Tài khoản của con', Icon: UsersIcon },
  { href: '/account/notifications', label: 'Thông báo', Icon: BellIcon },
  { href: '/account/change-password', label: 'Đổi mật khẩu', Icon: LockIcon },
]

const ORDERS_HREF = '/account/orders'

// Red number next to "Đơn hàng của tôi" while orders wait for payment.
function PendingOrdersPill() {
  const count = usePendingOrders().length
  if (count === 0) return null
  return <span className="rounded-full bg-red px-2 py-0.5 text-xs font-extrabold text-white">{count}</span>
}

function PointBadge({ points, active }: { points: number; active: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${active ? 'bg-green text-white' : 'bg-yellow/20 text-ink'}`}>
      {points.toLocaleString()}
    </span>
  )
}

function EdgeIndicator({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const isLeft = side === 'left'
  const Chevron = isLeft ? ChevronLeftIcon : ChevronRightIcon
  return (
    <div className={`pointer-events-none absolute inset-y-0 z-10 flex w-12 items-center from-bg via-bg/80 to-transparent ${isLeft ? 'left-0 justify-start bg-gradient-to-r' : 'right-0 justify-end bg-gradient-to-l'}`}>
      <button type="button" onClick={onClick} aria-label={isLeft ? 'Cuộn sang trái' : 'Cuộn sang phải'}
        className="pointer-events-auto grid size-8 cursor-pointer place-items-center rounded-full border border-line bg-white shadow-md">
        <Chevron className="size-4" />
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
    <nav className="sticky top-[76px] z-30 -mx-4 border-b border-line bg-bg/95 py-2 backdrop-blur-md lg:hidden" aria-label="Tài khoản">
      <div className="relative">
        <div ref={ref} className="flex snap-x gap-2 overflow-x-scroll overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map(({ href, label, Icon, isPoint }) => {
            const active = pathname === href
            return (
              <Link
                key={href} href={href} ref={active ? activeRef : undefined}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm no-underline ${
                  active ? 'border-green bg-green-soft text-green-dark font-extrabold' : 'border-line bg-white font-bold text-text'
                }`}
              >
                <Icon className="size-4" />
                {label}
                {isPoint && <PointBadge points={points} active={active} />}
                {href === ORDERS_HREF && <PendingOrdersPill />}
              </Link>
            )
          })}
          <button type="button" onClick={onLogout}
            className="inline-flex min-h-11 shrink-0 cursor-pointer snap-start items-center gap-2 whitespace-nowrap rounded-full border border-line bg-white px-4 text-sm font-bold text-red">
            <LogoutIcon className="size-4" /> Đăng xuất
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
    <aside className="hidden h-fit lg:block">
      <div className="sticky top-24 overflow-hidden rounded-card border border-line bg-white">
        <div className="flex items-center gap-3 border-b border-line p-5">
          {user.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={user.image} alt={user.name} className="size-12 rounded-full border-2 border-line object-cover" />
            : <div className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue to-green text-lg font-extrabold text-white">{user.name?.charAt(0).toUpperCase()}</div>
          }
          <div className="overflow-hidden">
            <div className="truncate text-sm font-extrabold text-ink">{user.name}</div>
            <div className="truncate text-xs text-muted">{user.phone}</div>
          </div>
        </div>

        <nav className="py-2">
          {NAV_ITEMS.map(({ href, label, Icon, isPoint }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 border-l-[3px] px-5 py-3 text-sm no-underline transition-colors ${
                  active ? 'border-blue bg-blue-soft font-bold text-blue' : 'border-transparent font-medium text-text hover:bg-bg'
                }`}>
                <Icon className="size-[18px] shrink-0" />
                <span className="flex-1">{label}</span>
                {isPoint && <PointBadge points={user.walletC ?? 0} active={active} />}
                {href === ORDERS_HREF && <PendingOrdersPill />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-line py-2">
          <button type="button" onClick={onLogout}
            className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-5 py-3 text-left text-sm font-medium text-red transition-colors hover:bg-red-soft">
            <LogoutIcon className="size-[18px] shrink-0" /> Đăng xuất
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

  if (isAuthLoading) {
    return (
      <div className="min-h-[80vh] bg-bg py-3 lg:py-10">
        <div className="container rounded-card border border-line bg-white p-5">
          <ListSkeleton />
        </div>
      </div>
    )
  }
  if (!user) return null

  const handleLogout = () => { logout(); router.push('/') }

  return (
    <div className="min-h-[80vh] bg-bg py-3 lg:py-10">
      <div className="container">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr] lg:gap-6">
          <MobileNav pathname={pathname} points={user.walletC ?? 0} onLogout={handleLogout} />
          <DesktopSidebar pathname={pathname} user={user} onLogout={handleLogout} />
          <main className="min-w-0">
            {pathname !== ORDERS_HREF && <div className="mb-3 empty:hidden"><PendingOrdersCard /></div>}
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
