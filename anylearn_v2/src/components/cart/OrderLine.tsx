import Link from 'next/link'
import ItemActivityChips from '@/components/ItemActivityChips'
import { formatExactPrice } from '@/lib/format/price'
import { BookIcon } from '@/components/icons'

export interface OrderLineItem {
  title: string
  price: number
  image?: string
  studentName?: string
  scheduleTitle?: string
  scheduleTime?: string
  activities?: { type: string; date?: string }[]
}

interface Props {
  item: OrderLineItem
  href?: string
  action?: React.ReactNode
}

export default function OrderLine({ item, href, action }: Props) {
  const schedule = [item.scheduleTitle, item.scheduleTime].filter(Boolean).join(' · ')
  const title = (
    <>
      {item.title}
      {item.studentName && <span className="font-normal text-muted"> ({item.studentName})</span>}
    </>
  )

  return (
    <li className="flex items-start gap-3 border-b border-line px-4 py-3.5 last:border-b-0 sm:px-5">
      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-green-soft to-blue-soft text-blue/40">
        {item.image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.image} alt="" loading="lazy" className="size-full object-cover" />
          : <BookIcon className="size-6" />
        }
      </div>
      <div className="min-w-0 flex-1">
        {href
          ? <Link href={href} className="block text-[15px] font-extrabold leading-tight text-green-dark no-underline">{title}</Link>
          : <div className="text-[15px] font-extrabold leading-tight text-green-dark">{title}</div>
        }
        {schedule && <div className="mt-0.5 text-xs text-blue">{schedule}</div>}
        <ItemActivityChips activities={item.activities} />
        <div className="mt-1 text-[15px] font-extrabold text-red sm:hidden">{formatExactPrice(item.price)}</div>
      </div>
      <div className="hidden shrink-0 text-right text-[15px] font-extrabold text-red sm:block">{formatExactPrice(item.price)}</div>
      {action && <div className="-mt-3 -mr-2.5 -mb-3 grid w-11 shrink-0 place-items-center self-start">{action}</div>}
    </li>
  )
}
