import type { ComponentType, SVGProps } from 'react'
import { BellIcon, BookIcon, CalendarIcon, CoinIcon, GiftIcon, LockIcon, MapIcon, TagIcon, UserIcon, UsersIcon } from '@/components/icons'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>
export interface NavItem { href: string; label: string; Icon: IconComponent; isPoint?: boolean }

// Ordered by how often people need them: courses and schedule first, settings last.
export const NAV_ITEMS: NavItem[] = [
  { href: '/account/orders', label: 'Khóa học của tôi', Icon: BookIcon },
  { href: '/account/schedule', label: 'Lịch học', Icon: CalendarIcon },
  { href: '/account/children', label: 'Quản lý người học', Icon: UsersIcon },
  { href: '/account/journey', label: 'Hành trình HỌC không giới hạn!', Icon: MapIcon },
  { href: '/account/rewards', label: 'Ưu đãi của tôi', Icon: GiftIcon },
  { href: '/account/vouchers', label: 'Ví voucher', Icon: TagIcon },
  { href: '/account/anypoint', label: 'anyPoint', Icon: CoinIcon, isPoint: true },
  { href: '/account/profile', label: 'Thông tin cá nhân', Icon: UserIcon },
  { href: '/account/notifications', label: 'Thông báo', Icon: BellIcon },
  { href: '/account/change-password', label: 'Đổi mật khẩu', Icon: LockIcon },
]

export const ACCOUNT_HOME = '/account'

/** Title of the page the person is on, for the back bar on phones; sub-pages like /account/children/5 count as their parent. */
export function accountPageTitle(pathname: string): string {
  const match = NAV_ITEMS.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))
  return match?.label ?? 'Tài khoản'
}
