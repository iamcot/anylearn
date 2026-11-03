import type { ReactNode } from 'react'
import { TagIcon } from '@/components/icons'
import { formatVnd } from '@/lib/vouchers/rules'

interface Props {
  value: number
  title: string
  condition: string
  note?: string | null
  warn?: boolean
  dim?: boolean
  action?: ReactNode
}

/** One voucher drawn as a ticket: the amount on a green stub, the title and conditions on the right. */
export default function VoucherTicket({ value, title, condition, note, warn, dim, action }: Props) {
  return (
    <div className={`flex min-w-0 items-stretch overflow-hidden rounded-xl border border-line bg-white ${dim ? 'opacity-60' : ''}`}>
      <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed border-line bg-green-soft px-2 py-3 text-center">
        <TagIcon className="size-5 text-green-dark" />
        <div className="text-sm font-black leading-tight text-green-dark">-{formatVnd(value)}</div>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold text-ink">{title}</div>
          <div className="mt-0.5 text-xs text-muted">{condition}</div>
          {note && <div className={`mt-0.5 text-xs font-bold ${warn ? 'text-warn-text' : 'text-muted'}`}>{note}</div>}
        </div>
        {action}
      </div>
    </div>
  )
}
