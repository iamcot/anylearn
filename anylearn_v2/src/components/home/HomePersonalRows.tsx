'use client'

import { useCallback, useMemo, useState } from 'react'
import { forYouBlock, hotNearBlock, topRatedBlock } from '@/lib/home/blocks'
import DiscoverCard from './DiscoverCard'
import HomeCourseRow from './HomeCourseRow'
import { useHomeContext } from './useHomeContext'

// "Dành cho Bin", "Đang hot gần bạn" and "Được đánh giá cao". Each row leaves out the courses of the rows above it,
// so the same course card is not shown twice on the page.
export default function HomePersonalRows() {
  const { ready, context } = useHomeContext()
  const [forYouIds, setForYouIds] = useState<number[] | null>(null)
  const [hotIds, setHotIds] = useState<number[] | null>(null)
  const hot = hotNearBlock(context)

  // Another child, or no address: the rows below start over.
  const rowsKey = JSON.stringify([forYouBlock(context), hot])
  const [seenKey, setSeenKey] = useState(rowsKey)
  if (seenKey !== rowsKey) {
    setSeenKey(rowsKey)
    setForYouIds(null)
    setHotIds(null)
  }

  const afterForYou = useMemo(() => forYouIds === null ? null : new Set(forYouIds), [forYouIds])
  const afterHot = useMemo(() => {
    if (afterForYou === null) return null
    if (!hot) return afterForYou
    return hotIds === null ? null : new Set([...afterForYou, ...hotIds])
  }, [afterForYou, hot, hotIds])
  const onForYou = useCallback((ids: number[]) => setForYouIds(ids), [])
  const onHot = useCallback((ids: number[]) => setHotIds(ids), [])

  if (!ready) return <div className="container h-64" aria-hidden="true" />
  return (
    <>
      <HomeCourseRow block={forYouBlock(context)} onShown={onForYou} />
      <DiscoverCard childName={context.learner?.name} chipKey={context.learner?.chipKey} near={!!context.near} />
      {hot && <HomeCourseRow block={hot} exclude={afterForYou} onShown={onHot} />}
      <HomeCourseRow block={topRatedBlock()} exclude={afterHot} />
    </>
  )
}
