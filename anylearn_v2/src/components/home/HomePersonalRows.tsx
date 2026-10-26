'use client'

import { forYouBlock, hotNearBlock } from '@/lib/home/blocks'
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
    </>
  )
}
