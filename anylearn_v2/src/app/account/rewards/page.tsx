'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import AccountCard from '@/components/account/AccountCard'
import TierCard from '@/components/membership/TierCard'
import { CoinIcon, GiftIcon } from '@/components/icons'
import { getMyRewards, type MyRewards } from '@/lib/api/rewards'
import { getMyPointExpiry } from '@/lib/api/pointsExpiry'
import { expiryLine, type MyPointExpiry } from '@/lib/points/expiry'
import { familyOfferLine } from '@/lib/membership/familyOffer'
import { formatPoints } from '@/lib/points/reward'
import { POINT_VALUE_VND } from '@/config/points'
import { formatExactPrice } from '@/lib/format/price'

/** Plan 06.5: everything that gives the family a benefit, in one place. Each block links to the page with the detail. */
export default function RewardsPage() {
  const { user, token, refreshUser } = useAuth()
  const [rewards, setRewards] = useState<MyRewards | null>(null)
  const [expiry, setExpiry] = useState<MyPointExpiry | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) return
    getMyRewards(token).then(setRewards)
    getMyPointExpiry(token).then(setExpiry)
    refreshUser()
  }, [token, refreshUser])

  const balance = user?.walletC ?? 0
  const expiryText = expiryLine(expiry)

  async function copyLink() {
    if (!rewards) return
    try {
      await navigator.clipboard.writeText(rewards.referral.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked: the link stays visible to copy by hand */ }
  }

  return (
    <div className="flex flex-col gap-4">
      <AccountCard title="Ưu đãi của tôi" subtitle="anyPoint, hạng thành viên, ưu đãi gia đình và giới thiệu bạn bè">
        <div className="border-b border-line bg-gradient-to-r from-blue-soft to-green-soft px-5 py-5">
          <div className="mb-1 text-xs text-muted">anyPoint hiện có</div>
          <div className="flex items-center gap-2 text-3xl font-extrabold text-ink">
            <CoinIcon className="size-8 text-yellow" />
            {formatPoints(balance)}
            <span className="ml-1 text-base font-bold text-muted">anyPoint</span>
          </div>
          <div className="mt-1 text-sm text-muted">~ {formatExactPrice(balance * POINT_VALUE_VND)} giảm cho khóa học tiếp theo</div>
          {expiryText && <div className="mt-1 text-sm font-bold text-warn-text">{expiryText}</div>}
          <Link href="/account/anypoint" className="mt-2 inline-block text-sm font-bold text-green-dark">Xem lịch sử và cách tích điểm</Link>
        </div>
      </AccountCard>

      <TierCard />

      {rewards?.family.enabled && (
        <div className="rounded-card border border-line bg-white p-4">
          <div className="flex items-center gap-2 text-base font-extrabold text-ink"><GiftIcon className="size-5 text-green-dark" /> Ưu đãi gia đình</div>
          <p className="m-0 mt-2 text-sm text-ink">{familyOfferLine(rewards.family.percent, rewards.family.windowDays)}</p>
          <p className="m-0 mt-1 text-xs text-muted">Giá giảm hiện ngay ở giỏ hàng khi đủ điều kiện.</p>
          <Link href="/account/children" className="mt-2 inline-block text-sm font-bold text-green-dark">Quản lý tài khoản của con</Link>
        </div>
      )}

      {rewards && rewards.referral.code && (
        <div className="rounded-card border border-line bg-white p-4">
          <div className="text-base font-extrabold text-ink">Giới thiệu bạn bè</div>
          <p className="m-0 mt-2 text-sm text-ink">Bạn bè đăng ký và mua khóa học, bạn nhận anyPoint.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-ink">{rewards.referral.code}</code>
            <button type="button" onClick={copyLink} className="min-h-11 cursor-pointer rounded-full border-0 bg-green px-5 text-sm font-black text-white hover:bg-green-dark">
              {copied ? 'Đã chép liên kết' : 'Chép liên kết giới thiệu'}
            </button>
          </div>
          <div className="mt-3 flex gap-6 text-sm">
            <div><div className="text-xs text-muted">Bạn đã mời</div><div className="font-extrabold text-ink">{rewards.referral.invited}</div></div>
            <div><div className="text-xs text-muted">anyPoint nhận được</div><div className="font-extrabold text-ink">{formatPoints(rewards.referral.pointsEarned)}</div></div>
          </div>
        </div>
      )}
    </div>
  )
}
