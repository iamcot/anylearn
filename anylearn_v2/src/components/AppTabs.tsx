'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { TODAY_NAV, isNavActive, type TodayNavItem } from '@/lib/today/nav'

const ACCOUNT_HREF = '/account/profile'

function TabIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function UserAvatar({ active }: { active: boolean }) {
  const { user } = useAuth()
  const ring = active ? 'ring-2 ring-blue' : 'ring-1 ring-line'

  if (user?.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.image} alt="" className={`h-6 w-6 rounded-full object-cover ${ring}`} />
  }
  return (
    <span className={`grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-blue to-green text-xs font-extrabold text-white ${ring}`} aria-hidden="true">
      {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

function Tab({ item, active }: { item: TodayNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold no-underline ${active ? 'text-blue' : 'text-muted'}`}
    >
      {item.href === ACCOUNT_HREF ? <UserAvatar active={active} /> : <TabIcon path={item.icon} />}
      {item.label}
    </Link>
  )
}

export default function AppTabs() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Menu chính"
    >
      {TODAY_NAV.map(item => <Tab key={item.href} item={item} active={isNavActive(pathname, item.href)} />)}
    </nav>
  )
}
