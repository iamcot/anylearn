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
  /** A voucher bought with Leo Xu: gold stub with Leo on it. `badge` is the line above the title ("Đổi bằng Leo Xu"). */
  leo?: boolean
  badge?: ReactNode
}

/** Leo Xu voucher: gold coin stub, Leo standing at the bottom of it, a light gold body. */
function LeoTicket({ value, kind, title, condition, note, warn, dim, action, badge }: Props) {
  return (
    <div className={`relative flex h-full min-w-0 items-stretch overflow-hidden rounded-xl bg-gradient-to-r from-[#fff4d1] via-white to-[#fffaeb] shadow-[0_4px_14px_rgba(217,119,6,.18)] ring-1 ring-[#f5d27a] ${dim ? 'opacity-60' : ''}`}>
      <div className="relative flex w-24 shrink-0 flex-col items-center overflow-hidden border-r-2 border-dashed border-white/80 bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706] px-1 pt-2.5 text-center text-white">
        <span aria-hidden className="pointer-events-none absolute -right-5 -top-5 size-14 rounded-full bg-white/25" />
        <div className="relative text-[15px] font-black leading-tight [text-shadow:0_1px_2px_rgba(146,64,14,.45)]">-{amountLabel({ kind, value })}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fun/leo_voucher.png" alt="Leo" width={64} height={61} className="relative mt-auto -mb-1 h-auto w-16 drop-shadow-[0_2px_3px_rgba(120,53,15,.35)]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1.5 px-3 py-2.5">
        <div className="min-w-[150px] flex-1">
          {badge && <div className="mb-0.5 flex items-center gap-1 text-xs font-extrabold text-[#b45309]"><span>{badge}</span></div>}
          <div className="line-clamp-2 text-sm font-extrabold leading-snug text-ink">{title}</div>
          <div className="mt-0.5 text-xs text-muted">{condition}</div>
          {note && <div className={`mt-0.5 text-xs font-bold ${warn ? 'text-warn-text' : 'text-[#b45309]'}`}>{note}</div>}
        </div>
        {action}
      </div>
    </div>
  )
}

/** One voucher drawn as a ticket: the amount on a green stub, the title and conditions on the right.
 *  It fills its parent's height, so tickets side by side in a row (CollectVouchers) are all as tall as the tallest. */
export default function VoucherTicket(props: Props) {
  const { value, kind, title, condition, note, warn, dim, action, vivid, leo } = props
  if (leo) return <LeoTicket {...props} />
  if (vivid) {
    return (
      <div className={`relative flex h-full min-w-0 items-stretch overflow-hidden rounded-xl bg-gradient-to-r from-[#fff1e6] via-white to-[#fff7d6] shadow-[0_4px_14px_rgba(255,107,53,.18)] ring-1 ring-[#ffd2b8] ${dim ? 'opacity-60' : ''}`}>
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
    <div className={`flex h-full min-w-0 items-stretch overflow-hidden rounded-xl border border-line bg-white ${dim ? 'opacity-60' : ''}`}>
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
