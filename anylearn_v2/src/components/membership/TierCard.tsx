'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getMyTier, type MyTier } from '@/lib/api/membership'
import { multiplierLine, nextTierLine, tierProgress, TIER_STYLE } from '@/lib/membership/tier'
import { formatExactPrice } from '@/lib/format/price'

/** Member tier at the top of /account and the anyPoint page: where you are, what is left to the next tier, what it gives. */
export default function TierCard() {
  const { token } = useAuth()
  const [tier, setTier] = useState<MyTier | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!token) return
    getMyTier(token).then(setTier)
  }, [token])

  if (!tier || !tier.applies) return null
  const boost = multiplierLine(tier.multiplier)

  return (
    <div className="rounded-card border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted">Hạng thành viên</div>
          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-extrabold ${TIER_STYLE[tier.tier] ?? TIER_STYLE.member}`}>{tier.label}</span>
        </div>
        <div className="text-right text-xs text-muted">
          Đã chi 12 tháng qua
          <div className="text-sm font-extrabold text-ink">{formatExactPrice(tier.spent12m)}</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={tierProgress(tier)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-green" style={{ width: `${tierProgress(tier)}%` }} />
      </div>
      <p className="m-0 mt-2 text-sm text-ink">{nextTierLine(tier)}</p>
      {boost && <p className="m-0 mt-1 text-sm font-bold text-green-dark">{boost}</p>}
      <button type="button" onClick={() => setOpen(value => !value)} className="mt-2 cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-green-dark">
        {open ? 'Ẩn quyền lợi các hạng' : 'Xem quyền lợi các hạng'}
      </button>
      {open && (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-sm">
          {tier.tiers.map(row => (
            <li key={row.key} className="flex items-center justify-between gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TIER_STYLE[row.key] ?? TIER_STYLE.member}`}>{row.label}</span>
              <span className="text-muted">
                {row.minSpent > 0 ? `từ ${formatExactPrice(row.minSpent)}` : 'mặc định'} · anyPoint x{row.multiplier.toLocaleString('vi-VN')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
