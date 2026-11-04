import Link from 'next/link'
import FoundationBar from './FoundationBar'
import { ContributionIcon } from './icons'
import { houseOrdinal } from '@/lib/foundation/rules'
import type { FoundationOfOrder } from '@/lib/api/gamification'

// Order success: what this order gave the anyLEARN Foundation, with the house picture (bricks pulse on the row being built).
export default function OrderFoundationNote({ foundation }: { foundation: FoundationOfOrder }) {
  return (
    <Link href="/foundation" className="mb-5 block rounded-card border border-line bg-gradient-to-r from-[#fff6ec] to-white p-4 text-left text-ink no-underline">
      <div className="flex items-center gap-3 text-sm">
        <ContributionIcon label={foundation.label} className="size-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-extrabold">Đơn của bạn góp {foundation.label}</div>
          <p className="m-0 mt-0.5 text-xs text-muted">cho {houseOrdinal(foundation.houseNo)} của chương trình anyLEARN Foundation (nhà vệ sinh cho trường vùng cao).</p>
        </div>
      </div>
      <div className="mt-1"><FoundationBar percent={foundation.percent} housesBuilt={foundation.housesBuilt} currentHouse={foundation.houseNo} size="sm" /></div>
    </Link>
  )
}
