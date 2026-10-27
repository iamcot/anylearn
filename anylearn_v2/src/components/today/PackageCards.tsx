'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { renewEnrollment } from '@/lib/today/api'
import { formatDayMonth, renewLink } from '@/lib/today/format'
import type { PackageView } from '@/lib/today/types'

const CARD = 'rounded-[20px] border border-line bg-white p-4'

export function FeeSummary({ feeDueTotal }: { feeDueTotal: number }) {
  if (feeDueTotal <= 0) return null
  return (
    <p className="rounded-xl border border-warn-line bg-warn-soft px-4 py-3 text-sm font-bold text-warn-text">
      Cần đóng trong 7 ngày: {feeDueTotal} khoản
    </p>
  )
}

/** One tap: the renewal goes in the cart and the person lands on checkout; when it cannot (class closed...) the old add-to-cart page opens. */
function RenewButton({ pack, learnerId }: { pack: PackageView; learnerId: number }) {
  const router = useRouter()
  const { token } = useAuth()
  const [busy, setBusy] = useState(false)

  async function renew() {
    if (!token) return router.push(renewLink(pack.itemId, learnerId))
    setBusy(true)
    const { data } = await renewEnrollment(pack.enrollmentId, token)
    router.push(data ? '/checkout' : renewLink(pack.itemId, learnerId))
  }

  return (
    <button
      type="button" onClick={renew} disabled={busy}
      className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-green px-5 text-[15px] font-black text-white hover:bg-green-dark disabled:opacity-60"
    >
      Gia hạn
    </button>
  )
}

function PackageRow({ pack, learnerId }: { pack: PackageView; learnerId: number }) {
  const percent = pack.total > 0 ? Math.min(100, Math.round((pack.used / pack.total) * 100)) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-black text-ink">{pack.title}</h3>
        <span className="shrink-0 text-base font-black text-ink">{pack.used}/{pack.total} buổi</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pack.used} aria-valuemax={pack.total}>
        <div className="h-full rounded-full bg-green" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm text-muted">
          {pack.remaining > 0 ? `Còn ${pack.remaining} buổi` : 'Đã học hết số buổi'}
          {pack.endDate ? ` · Hết hạn ${formatDayMonth(pack.endDate)}` : ''}
        </span>
        {pack.showRenew && <RenewButton pack={pack} learnerId={learnerId} />}
      </div>
    </div>
  )
}

export function PackageCards({ packages, learnerId }: { packages: PackageView[]; learnerId: number }) {
  if (packages.length === 0) return null
  return (
    <section className={`${CARD} space-y-5`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Gói học</span>
        <Link href="/account/orders" className="text-sm font-bold text-green-dark">Xem tất cả</Link>
      </div>
      {packages.map(pack => <PackageRow key={pack.enrollmentId} pack={pack} learnerId={learnerId} />)}
    </section>
  )
}
