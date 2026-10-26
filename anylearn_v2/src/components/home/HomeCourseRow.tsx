'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { searchItems, type Item } from '@/lib/api'
import type { HomeBlock } from '@/lib/home/blocks'
import CourseCard from '@/components/CourseCard'
import ScrollRow from '@/components/ScrollRow'

const ROW_SIZE = 8

function Skeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-60 w-[220px] shrink-0 rounded-card bg-surface" />)}
    </div>
  )
}

// One personal row of the home page. Fetches again when the block changes (another child chosen); an empty answer hides it.
export default function HomeCourseRow({ block }: { block: HomeBlock }) {
  const key = JSON.stringify([block.sort, block.age, block.extra])
  const [loaded, setLoaded] = useState<{ key: string; items: Item[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    searchItems('', 0, ROW_SIZE, { sort: block.sort, age: block.age, extra: block.extra }).then(result => {
      if (!cancelled) setLoaded({ key, items: result.items })
    })
    return () => { cancelled = true }
    // `key` stands for the whole block
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const items = loaded?.key === key ? loaded.items : null
  if (items && items.length === 0) return null

  return (
    <section className="pt-6 lg:pt-8">
      <div className="container">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-lg font-extrabold text-ink lg:text-2xl">{block.title}</h2>
          <Link href={block.seeAllHref} className="shrink-0 text-sm font-medium text-green-dark no-underline">Xem tất cả ›</Link>
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
