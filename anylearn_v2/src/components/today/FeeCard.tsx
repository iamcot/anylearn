import Link from 'next/link'
import { feePayLabel, formatDayMonth, renewLink, upperFirst } from '@/lib/today/format'
import type { FeeView } from '@/lib/today/types'

const SOFT_CARD = 'rounded-[20px] border border-warn-line bg-warn-soft p-4'

function PayButton({ fee, learnerId }: { fee: FeeView; learnerId: number }) {
  return (
    <Link
      href={renewLink(fee.itemId, learnerId, fee.nextStart)}
      className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-green px-5 text-[15px] font-black text-white hover:bg-green-dark"
    >
      {feePayLabel(fee)}
    </Link>
  )
}

function FeeHeader({ fee }: { fee: FeeView }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-warn-text">Học phí · {fee.itemTitle}</span>
      {fee.paidUntil && fee.state === 'DUE_SOON' && (
        <span className="shrink-0 text-xs font-semibold text-muted">Hạn {formatDayMonth(fee.paidUntil)}</span>
      )}
    </div>
  )
}

function PendingCard({ fee }: { fee: FeeView }) {
  return (
    <section className="rounded-[20px] border border-line bg-white p-4">
      <span className="text-xs font-bold uppercase tracking-wide text-muted">Học phí · {fee.itemTitle}</span>
      <h3 className="mt-1 text-base font-black text-ink">Đang chờ xác nhận thanh toán</h3>
      <p className="mt-1 text-sm text-muted">
        anyLEARN đang kiểm tra khoản thanh toán của bạn. Bạn không cần đóng lại.
      </p>
      <Link href="/account/orders" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-blue">
        Xem đơn hàng
      </Link>
    </section>
  )
}

export default function FeeCard({ fee, learnerId }: { fee: FeeView; learnerId: number }) {
  if (fee.state === 'AWAITING_CONFIRMATION') return <PendingCard fee={fee} />
  if (fee.state === 'HIDDEN') return null

  const overdue = fee.state === 'OVERDUE'
  const headline = overdue
    ? `Chưa nhận được học phí ${fee.nextPeriodLabel.toLowerCase()}`
    : `Đã đóng ${fee.paidUntilText ?? ''}`.trim()

  return (
    <section className={SOFT_CARD}>
      <FeeHeader fee={fee} />
      <h3 className="mt-1 text-lg font-black text-ink">{upperFirst(headline)}</h3>
      {overdue && fee.paidUntilText && (
        <p className="text-sm text-muted">Đã đóng {fee.paidUntilText}. Bạn đóng giúp để việc học không bị gián đoạn.</p>
      )}
      <PayButton fee={fee} learnerId={learnerId} />
    </section>
  )
}
