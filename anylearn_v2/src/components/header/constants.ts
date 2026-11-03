import { TODAY_NAV } from '@/lib/today/nav'

export const NAV_LINKS = [
  { href: '/info', label: 'Giới thiệu' },
  { href: '/search?mode=school', label: 'anySCHOOL' },
  { href: '/search?mode=teacher', label: 'anyPROFESSOR' },
]

/** Same items and order as the mobile bottom tabs (schedule and account live in the user menu on desktop). */
export const MEMBER_NAV_LINKS = TODAY_NAV.filter(item => ['Cộng đồng', 'Hôm nay', 'Vui học'].includes(item.label))

/** The desktop top bar is the same for visitors and members: the signed-in pages ask a visitor to log in. */
export const DESKTOP_NAV_LINKS = [NAV_LINKS[0], ...MEMBER_NAV_LINKS]

export const ACCOUNT_MENU = [
  { href: '/account', label: 'Tổng quan tài khoản' },
  { href: '/account/orders', label: 'Khóa học của tôi' },
  { href: '/account/schedule', label: 'Lịch học' },
  { href: '/account/children', label: 'Quản lý người học' },
  { href: '/account/journey', label: 'Hành trình HỌC không giới hạn!' },
  { href: '/account/rewards', label: 'Ưu đãi của tôi' },
  { href: '/account/vouchers', label: 'Ví voucher' },
  { href: '/account/anypoint', label: 'anyPoint' },
  { href: '/account/profile', label: 'Thông tin cá nhân' },
  { href: '/account/change-password', label: 'Đổi mật khẩu' },
]

export const ICON_BUTTON_CLASS = 'relative grid size-9 shrink-0 min-[400px]:size-10 lg:size-[38px] cursor-pointer place-items-center text-ink no-underline'
