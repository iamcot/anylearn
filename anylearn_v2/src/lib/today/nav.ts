export interface TodayNavItem {
  href: string
  label: string
  icon: string
  inHeader: boolean
}

export const TODAY_NAV: TodayNavItem[] = [
  { href: '/today', label: 'Hôm nay', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', inHeader: true },
  { href: '/account/schedule', label: 'Lịch', icon: 'M4 5h16v15H4zM4 10h16M8 3v4M16 3v4', inHeader: true },
  { href: '/today/diary', label: 'Nhật ký', icon: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h4', inHeader: true },
  { href: '/today/community', label: 'Cộng đồng', icon: 'M4 5h16v11H9l-5 4z', inHeader: true },
  { href: '/account', label: 'Tài khoản', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', inHeader: true },
]

const ACCOUNT_HOME = '/account'
const SCHEDULE = '/account/schedule'

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/today') return pathname === '/today'
  if (href === ACCOUNT_HOME) return pathname.startsWith('/account') && !pathname.startsWith(SCHEDULE)
  return pathname.startsWith(href)
}
