import Link from 'next/link'
import { homeQuickLinks } from '@/lib/home/blocks'
import { CalendarIcon, GiftIcon, MonitorIcon, PinIcon, TagIcon } from '@/components/icons'
import { GUEST_CHIP_OFF } from '@/components/guest/chipStyles'

const ICONS: Record<string, React.ReactNode> = {
  'Gần tôi': <PinIcon className="size-4" />,
  'Cuối tuần': <CalendarIcon className="size-4" />,
  'Học thử': <GiftIcon className="size-4" />,
  'Giảm giá': <TagIcon className="size-4" />,
  'Online': <MonitorIcon className="size-4" />,
}

// Quick ways into the search, same chips as the search page; one tap opens the search already filtered.
export default function HomeQuickChips() {
  return (
    <div className="mt-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Lọc nhanh">
      {homeQuickLinks().map(link => (
        <Link key={link.label} href={link.href} className={`${GUEST_CHIP_OFF} gap-1.5`}>
          {ICONS[link.label]}
          {link.label}
        </Link>
      ))}
    </div>
  )
}
