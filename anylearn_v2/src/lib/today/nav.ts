export interface TodayNavItem {
  href: string
  label: string
  icon: string
  inHeader: boolean
}

export const TODAY_NAV: TodayNavItem[] = [
  { href: '/account/schedule', label: 'Lịch', icon: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4', inHeader: true },
  { href: '/today/community', label: 'Cộng đồng', icon: 'M4 5h16v11H9l-5 4z', inHeader: true },
  { href: '/today', label: 'Hôm nay', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', inHeader: true },
  { href: '/today/fun', label: 'Vui học', icon: 'M6 8h12a4 4 0 0 1 4 4v2a3 3 0 0 1-5.2 2L15 14H9l-1.8 2A3 3 0 0 1 2 14v-2a4 4 0 0 1 4-4zM7 11v3M5.5 12.5h3M16 12h.01M18 13.5h.01', inHeader: true },
  { href: '/account', label: 'Tài khoản', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', inHeader: true },
]

const ACCOUNT_HOME = '/account'
const SCHEDULE = '/account/schedule'

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/today') return pathname === '/today'
  if (href === ACCOUNT_HOME) return pathname.startsWith('/account') && !pathname.startsWith(SCHEDULE)
  return pathname.startsWith(href)
}
