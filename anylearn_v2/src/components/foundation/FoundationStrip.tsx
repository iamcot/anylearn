import Link from 'next/link'
import { getFoundation } from '@/lib/api/gamification'
import HouseProgress from './HouseProgress'
import { ChevronRightIcon } from '@/components/icons'

// Home strip of anyLEARN Foundation (server component, cached a minute): the house being built and a link to the page.
export default async function FoundationStrip() {
  const state = await getFoundation()
  if (!state || !state.enabled) return null
  return (
    <Link href="/foundation" className="flex items-center gap-4 rounded-card border border-line bg-gradient-to-r from-[#fff6ec] to-white p-4 text-ink no-underline">
      <HouseProgress percent={state.percent} housesBuilt={state.housesBuilt} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold">Chương trình anyLEARN Foundation</div>
        <p className="m-0 mt-0.5 text-xs text-muted">
          Mỗi khóa học bạn đăng ký góp gạch xây nhà vệ sinh cho trường vùng cao. Căn số {state.currentHouse} đã xong {state.percent}%.
        </p>
      </div>
      <ChevronRightIcon className="size-4 shrink-0 text-muted" />
    </Link>
  )
}
