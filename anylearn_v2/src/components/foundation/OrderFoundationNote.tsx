import Link from 'next/link'
import HouseProgress from './HouseProgress'
import type { FoundationOfOrder } from '@/lib/api/gamification'

// Order success: what this order gave the anyLEARN Foundation, with the house picture (bricks pulse on the row being built).
export default function OrderFoundationNote({ foundation }: { foundation: FoundationOfOrder }) {
  return (
    <Link href="/foundation" className="mb-5 flex items-center gap-4 rounded-card border border-line bg-gradient-to-r from-[#fff6ec] to-white p-4 text-left text-ink no-underline">
      <HouseProgress percent={foundation.percent} housesBuilt={foundation.housesBuilt} size="sm" />
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-extrabold">Đơn của bạn góp {foundation.label} 🧱</div>
        <p className="m-0 mt-0.5 text-xs text-muted">cho căn nhà vệ sinh số {foundation.houseNo} của chương trình anyLEARN Foundation. Căn đang xây đã xong {foundation.percent}%.</p>
      </div>
    </Link>
  )
}
