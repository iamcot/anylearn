import type { ReactNode } from 'react'
import { TagIcon } from '@/components/icons'
import { amountLabel } from '@/lib/vouchers/rules'

interface Props {
  value: number
  /** 'percent' draws "-10%" instead of an amount. */
  kind?: string | null
  title: string
  condition: string
  note?: string | null
  warn?: boolean
  dim?: boolean
  action?: ReactNode
  /** Bright look for vouchers people can collect (warm gradient stub, punched notches). */
  vivid?: boolean
}

/** One voucher drawn as a ticket: the amount on a green stub, the title and conditions on the right. */
export default function VoucherTicket({ value, kind, title, condition, note, warn, dim, action, vivid }: Props) {
  if (vivid) {
    return (
      <div className={`relative flex min-w-0 items-stretch overflow-hidden rounded-xl bg-gradient-to-r from-[#fff1e6] via-white to-[#fff7d6] shadow-[0_4px_14px_rgba(255,107,53,.18)] ring-1 ring-[#ffd2b8] ${dim ? 'opacity-60' : ''}`}>
        <div className="relative flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed border-white/70 bg-gradient-to-br from-[#ff8a3d] via-[#ff5a5f] to-[#e8336d] px-2 py-3 text-center text-white">
          <span aria-hidden className="pointer-events-none absolute -left-6 -top-6 size-14 rounded-full bg-white/20" />
          <TagIcon className="size-5" />
          <div className="text-[15px] font-black leading-tight drop-shadow-sm">-{amountLabel({ kind, value })}</div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold text-ink">{title}</div>
            <div className="mt-0.5 text-xs text-muted">{condition}</div>
            {note && <div className={`mt-0.5 text-xs font-bold ${warn ? 'text-[#e8336d]' : 'text-muted'}`}>{note}</div>}
          </div>
          {action}
        </div>
      </div>
    )
  }
  return (
    <div className={`flex min-w-0 items-stretch overflow-hidden rounded-xl border border-line bg-white ${dim ? 'opacity-60' : ''}`}>
      <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed border-line bg-green-soft px-2 py-3 text-center">
        <TagIcon className="size-5 text-green-dark" />
        <div className="text-sm font-black leading-tight text-green-dark">-{amountLabel({ kind, value })}</div>
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
