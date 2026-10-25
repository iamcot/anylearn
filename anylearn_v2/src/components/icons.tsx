import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
)

export const CartIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 4h2.5l2 11h10l2-8H7" /><circle cx="9" cy="19.5" r="1.2" /><circle cx="17" cy="19.5" r="1.2" />
  </Icon>
)

export const BellIcon = (props: IconProps) => (
  <Icon {...props}><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4" /></Icon>
)

export const MenuIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
)

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>
)

export const UserIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
)

export const BookIcon = (props: IconProps) => (
  <Icon {...props}><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10" /></Icon>
)

export const CalendarIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 5h16v15H4zM4 10h16M8 3v4M16 3v4" /></Icon>
)

export const GiftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1-3-5-3-5-1s3 1 5 1zM12 7c1-3 5-3 5-1s-3 1-5 1z" />
  </Icon>
)

export const CardIcon = (props: IconProps) => (
  <Icon {...props}><path d="M3 6h18v12H3zM3 10h18M7 15h3" /></Icon>
)

export const ClipboardIcon = (props: IconProps) => (
  <Icon {...props}><path d="M7 4h10v17H7zM10 3h4v3h-4zM10 11h4M10 15h4" /></Icon>
)

export const MegaphoneIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 10v4h3l8 4V6L7 10zM18 9a4 4 0 0 1 0 6" /></Icon>
)

export const CoinIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.3-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5" /></Icon>
)

export const HeartIcon = ({ filled = false, ...props }: IconProps & { filled?: boolean }) => (
  <Icon {...props} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Icon>
)

export const StarIcon = ({ filled = false, ...props }: IconProps & { filled?: boolean }) => (
  <Icon {...props} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8z" />
  </Icon>
)

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>
)

export const ChevronLeftIcon = (props: IconProps) => (
  <Icon strokeWidth="2.2" {...props}><path d="m15 5-7 7 7 7" /></Icon>
)
