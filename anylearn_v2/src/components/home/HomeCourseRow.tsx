'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getTopRated, searchItems, type Item } from '@/lib/api'
import { pickFresh, ROW_SIZE } from '@/lib/home/dedupe'
import type { HomeBlock } from '@/lib/home/blocks'
import CourseCard from '@/components/CourseCard'
import ScrollRow from '@/components/ScrollRow'

// Ask for more than the row shows, so courses already seen in a row above can be left out.
const FETCH_SIZE = 24

function Skeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-60 w-[220px] shrink-0 rounded-card bg-surface" />)}
    </div>
  )
}

interface Props {
  block: HomeBlock
  // Ids shown in the rows above; null = those rows are still loading, so wait.
  exclude?: ReadonlySet<number> | null
  // Told once the row is known (an empty list when it hides itself).
  onShown?: (ids: number[]) => void
}

// One personal row of the home page. Fetches again when the block changes (another child chosen); an empty answer hides it.
export default function HomeCourseRow({ block, exclude = new Set(), onShown }: Props) {
  const key = JSON.stringify([block.sort, block.age, block.extra, block.source])
  const [loaded, setLoaded] = useState<{ key: string; items: Item[]; title?: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    const request = block.source === 'topRated'
      ? getTopRated(FETCH_SIZE).then(result => ({ items: result?.items ?? [], title: result?.title }))
      : searchItems('', 0, FETCH_SIZE, { sort: block.sort, age: block.age, extra: block.extra }).then(result => ({ items: result.items, title: undefined }))
    request.then(result => {
      if (!cancelled) setLoaded({ key, ...result })
    })
    return () => { cancelled = true }
    // `key` stands for the whole block
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const ready = loaded?.key === key && exclude !== null
  const items = ready ? pickFresh(loaded.items, exclude, ROW_SIZE) : null
  const shownKey = items ? items.map(item => item.id).join(',') : null

  useEffect(() => {
    if (shownKey !== null) onShown?.(shownKey === '' ? [] : shownKey.split(',').map(Number))
    // onShown is a stable setter of the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey])

  if (items && items.length === 0) return null

  return (
    <section className="pt-6 lg:pt-8">
      <div className="container">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-lg font-extrabold text-ink lg:text-2xl">{loaded?.key === key && loaded.title ? loaded.title : block.title}</h2>
          {block.seeAllHref && <Link href={block.seeAllHref} className="shrink-0 text-sm font-medium text-green-dark no-underline">Xem tất cả ›</Link>}
        </div>
        {items === null ? <Skeleton /> : (
          <ScrollRow>
            {items.map(item => <div key={item.id} className="grid w-[220px] shrink-0 sm:w-[250px]"><CourseCard item={item} /></div>)}
          </ScrollRow>
        )}
      </div>
    </section>
  )
}
