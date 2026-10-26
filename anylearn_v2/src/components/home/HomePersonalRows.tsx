'use client'

import { forYouBlock, hotNearBlock } from '@/lib/home/blocks'
import Link from 'next/link'
import { GiftIcon } from '@/components/icons'
import HomeCourseRow from './HomeCourseRow'
import { useHomeContext } from './useHomeContext'

// "Dành cho Bin" and "Đang hot gần bạn": the two rows that follow the chosen child and the saved address.
export default function HomePersonalRows() {
  const { ready, context } = useHomeContext()
  if (!ready) return <div className="container h-64" aria-hidden="true" />
  const hot = hotNearBlock(context)
  return (
    <>
      <HomeCourseRow block={forYouBlock(context)} />
      {hot && <HomeCourseRow block={hot} />}
      <div className="container pt-6">
        <Link href="/discover" className="btn btn--outline w-full gap-2 lg:w-auto">
          <GiftIcon className="size-5" />
          Thử điều mới cho con
        </Link>
      </div>
    </>
  )
}
