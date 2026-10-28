import { TODAY_NAV } from '@/lib/today/nav'

export const NAV_LINKS = [
  { href: '/info', label: 'Giới thiệu' },
  { href: '/search?mode=school', label: 'anySCHOOL' },
  { href: '/search?mode=teacher', label: 'anyPROFESSOR' },
]

/** Same items and order as the mobile bottom tabs (schedule and account live in the user menu on desktop). */
export const MEMBER_NAV_LINKS = TODAY_NAV.filter(item => ['Cộng đồng', 'Hôm nay', 'Vui học'].includes(item.label))

export const ACCOUNT_MENU = [
  { href: '/today', label: 'Hôm nay' },
  { href: '/account/profile', label: 'Thông tin cá nhân' },
  { href: '/account/children', label: 'Tài khoản của con' },
  { href: '/account/orders', label: 'Đơn hàng của tôi' },
  { href: '/account/favorites', label: 'Yêu thích' },
  { href: '/account/schedule', label: 'Lịch học' },
  { href: '/account/course-codes', label: 'Mã code khóa học' },
  { href: '/account/change-password', label: 'Đổi mật khẩu' },
]

export const ICON_BUTTON_CLASS = 'relative grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-white text-ink no-underline lg:size-[38px]'
