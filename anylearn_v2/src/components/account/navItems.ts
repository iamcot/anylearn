import type { ComponentType, SVGProps } from 'react'
import { BellIcon, CalendarIcon, CoinIcon, HeartIcon, KeyIcon, LockIcon, PackageIcon, UserIcon, UsersIcon } from '@/components/icons'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>
export interface NavItem { href: string; label: string; Icon: IconComponent; isPoint?: boolean }

export const NAV_ITEMS: NavItem[] = [
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

export const ACCOUNT_HOME = '/account'

/** Title of the page the person is on, for the back bar on phones; sub-pages like /account/children/5 count as their parent. */
export function accountPageTitle(pathname: string): string {
  const match = NAV_ITEMS.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  return match?.label ?? 'Tài khoản'
}
