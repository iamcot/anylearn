import Link from 'next/link'
import { getFoundationForItem } from '@/lib/api/gamification'
import { itemLine } from '@/lib/foundation/rules'
import { ContributionIcon } from './icons'

// One line on the course page: what registering this course gives the Foundation (server component).
export default async function FoundationItemLine({ itemId }: { itemId: number | string }) {
  const data = await getFoundationForItem(itemId)
  const text = itemLine(data?.label)
  if (!text) return null
  return (
    <Link href="/foundation" className="flex items-center gap-2 rounded-xl bg-[#fff6ec] px-3 py-2 text-xs font-semibold text-[#8a4a1f] no-underline">
      <ContributionIcon label={data?.label} className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">{text}</span>
      <span className="font-bold underline">Tìm hiểu</span>
    </Link>
  )
}
