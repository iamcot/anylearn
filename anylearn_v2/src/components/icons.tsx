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

export const ChevronRightIcon = (props: IconProps) => (
  <Icon strokeWidth="2.2" {...props}><path d="m9 5 7 7-7 7" /></Icon>
)

export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
)

export const PlayIcon = (props: IconProps) => (
  <Icon {...props}><path d="M8 5v14l11-7z" /></Icon>
)

export const BoltIcon = (props: IconProps) => (
  <Icon {...props}><path d="M13 3 5 13h6l-1 8 8-10h-6z" /></Icon>
)

export const ChatIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 5h16v11H9l-5 4z" /></Icon>
)

export const GlobeIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </Icon>
)

export const PencilIcon = (props: IconProps) => (
  <Icon {...props}><path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3" /></Icon>
)

export const MicIcon = (props: IconProps) => (
  <Icon {...props}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icon>
)

export const LightbulbIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
  </Icon>
)

export const SchoolIcon = (props: IconProps) => (
  <Icon {...props}><path d="m3 10 9-6 9 6M5 10v9h14v-9M10 19v-5h4v5" /></Icon>
)

export const CalculatorIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2" />
  </Icon>
)

export const MusicIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" />
  </Icon>
)

export const PhoneIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </Icon>
)

export const MailIcon = (props: IconProps) => (
  <Icon {...props}><path d="M3 6h18v12H3zM3 7l9 7 9-7" /></Icon>
)

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
)

export const ChevronDownIcon = (props: IconProps) => (
  <Icon strokeWidth="2.2" {...props}><path d="m6 9 6 6 6-6" /></Icon>
)

export const FilterIcon = (props: IconProps) => (
  <Icon strokeWidth="2.2" {...props}><path d="M4 6h16M8 12h12M12 18h8" /></Icon>
)

export const ListIcon = (props: IconProps) => (
  <Icon {...props}><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" /></Icon>
)

export const KeyIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3M14 9l2 2" /></Icon>
)

export const LockIcon = (props: IconProps) => (
  <Icon {...props}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>
)

export const LogoutIcon = (props: IconProps) => (
  <Icon {...props}><path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" /></Icon>
)

export const UsersIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></Icon>
)

export const PackageIcon = (props: IconProps) => (
  <Icon {...props}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9" /></Icon>
)

export const AlertIcon = (props: IconProps) => (
  <Icon {...props}><path d="M12 4 2.5 20h19zM12 10v4M12 17h.01" /></Icon>
)

export const ShareIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </Icon>
)

export const PlusSquareIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </Icon>
)

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icon>
)

export const RefreshIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4" />
  </Icon>
)

export const PinIcon = (props: IconProps) => (
  <Icon {...props}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>
)

export const MapIcon = (props: IconProps) => (
  <Icon {...props}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></Icon>
)

export const TagIcon = (props: IconProps) => (
  <Icon {...props}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.2" /></Icon>
)

export const MonitorIcon = (props: IconProps) => (
  <Icon {...props}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></Icon>
)

export const CameraIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Icon>
)

export const ShieldCheckIcon = (props: IconProps) => (
  <Icon {...props}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></Icon>
)

/** The AI mark: a big and a small four-point star. */
export const SparkleIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9L11 3z" />
    <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
  </Icon>
)
