'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import RequireLogin from '@/components/auth/RequireLogin'
import { ListSkeleton } from '@/components/PageSkeleton'
import { PendingOrdersPill, PointBadge } from '@/components/account/AccountBadges'
import PendingOrdersCard from '@/components/orders/PendingOrdersCard'
import { ChevronLeftIcon, LogoutIcon } from '@/components/icons'
import { ACCOUNT_HOME, NAV_ITEMS, accountPageTitle } from '@/components/account/navItems'

const ORDERS_HREF = '/account/orders'

// On a phone the menu is the /account page itself; every other page gets a back bar instead of scrolling tabs.
function MobileBackBar({ pathname }: { pathname: string }) {
  if (pathname === ACCOUNT_HOME) return null
  return (
    <nav className="sticky top-[76px] z-30 -mx-4 flex items-center gap-1 border-b border-line bg-bg/95 px-2 backdrop-blur-md lg:hidden" aria-label="Tài khoản">
      <Link href={ACCOUNT_HOME} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-text no-underline">
        <ChevronLeftIcon className="size-4" /> Tài khoản
      </Link>
      <span className="truncate text-sm font-extrabold text-ink">{accountPageTitle(pathname)}</span>
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
            const active = pathname === href || pathname.startsWith(href + '/')
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

  if (isAuthLoading) {
    return (
      <div className="min-h-[80vh] bg-bg py-3 lg:py-10">
        <div className="container rounded-card border border-line bg-white p-5">
          <ListSkeleton />
        </div>
      </div>
    )
  }
  if (!user) return <RequireLogin>{null}</RequireLogin>

  const handleLogout = () => { logout(); router.push('/') }

  return (
    <div className="min-h-[80vh] bg-bg py-3 lg:py-10">
      <div className="container">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr] lg:gap-6">
          <MobileBackBar pathname={pathname} />
          <DesktopSidebar pathname={pathname} user={user} onLogout={handleLogout} />
          <main className="min-w-0">
            {pathname !== ORDERS_HREF && pathname !== ACCOUNT_HOME && <div className="mb-3 empty:hidden"><PendingOrdersCard /></div>}
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
