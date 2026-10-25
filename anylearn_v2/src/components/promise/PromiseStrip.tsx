import Link from 'next/link'
import { CalendarIcon, ChatIcon, CoinIcon, RefreshIcon } from '@/components/icons'
import { PROMISES, type PromiseKey } from '@/config/promise'

const ICONS: Record<PromiseKey, typeof CoinIcon> = {
  price: CoinIcon,
  refund: RefreshIcon,
  schedule: CalendarIcon,
  support: ChatIcon,
}

// Under the "Thêm vào giỏ hàng" button of a course: the four promises in a few words each.
export default function PromiseStrip() {
  return (
    <section className="mt-4 rounded-card border border-line bg-white p-4" aria-label="Lời hứa anyLEARN">
      <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-3 p-0">
        {PROMISES.map(({ key, short }) => {
          const Icon = ICONS[key]
          return (
            <li key={key} className="flex items-start gap-2 text-sm text-ink">
              <Icon className="mt-0.5 size-5 shrink-0 text-green" />
              <span>{short}</span>
            </li>
          )
        })}
      </ul>
      <Link href="/info/why-anylearn" className="mt-3 inline-block text-xs font-medium text-green-dark underline">
        Vì sao đặt qua anyLEARN?
      </Link>
    </section>
  )
}
