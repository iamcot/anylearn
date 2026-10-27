'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getItemPathways, type Pathway, type PathwayCourse } from '@/lib/api/recommendations'

function Avatar({ course, size }: { course: PathwayCourse; size: string }) {
  const style = `${size} shrink-0 rounded-full border-2 border-white bg-bg object-cover`
  // eslint-disable-next-line @next/next/no-img-element
  return course.image ? <img src={course.image} alt="" loading="lazy" className={style} /> : <span className={`${style} inline-block`} />
}

/** "Lộ trình học" on the course page: a bar of the steps of the chain (horizontal on a desktop, vertical on a phone).
 *  This course's step is the big one; the others show two course pictures. The whole card opens the pathway page (plan 08.1). */
export default function PathwayBlock({ itemId }: { itemId: number }) {
  const [pathways, setPathways] = useState<Pathway[]>([])

  useEffect(() => {
    let cancelled = false
    getItemPathways(itemId).then(list => { if (!cancelled) setPathways(list.filter(p => p.steps.length >= 2)) })
    return () => { cancelled = true }
  }, [itemId])

  if (pathways.length === 0) return null
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-kicker mb-5">Lộ trình học</h2>
        <div className="space-y-4">
          {pathways.map(pathway => {
            const currentIndex = pathway.steps.findIndex(step => step.items.some(item => item.itemId === itemId))
            return (
              <Link key={pathway.id} href={`/pathway/${pathway.slug}`}
                className="block rounded-card border border-line bg-white p-4 no-underline transition-shadow hover:shadow-md lg:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 truncate text-base font-extrabold text-ink">{pathway.title}</div>
                  <span className="shrink-0 text-sm font-bold text-green-dark">Xem lộ trình ›</span>
                </div>
                <ol className="m-0 flex list-none flex-col p-0 md:flex-row">
                  {pathway.steps.map((step, index) => {
                    const current = index === currentIndex
                    const passed = index < currentIndex
                    const course = step.items.find(item => item.itemId === itemId) ?? step.items[0]
                    return (
                      <li key={step.stepNo} aria-current={current ? 'step' : undefined}
                        className="relative flex min-w-0 gap-3 pb-5 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-2 md:pb-0 md:text-center">
                        {index < pathway.steps.length - 1 && (
                          <span aria-hidden="true" className={`absolute left-[13px] top-7 h-full w-[3px] md:left-1/2 md:top-[13px] md:h-[3px] md:w-full ${index < currentIndex ? 'bg-green' : 'bg-line'}`} />
                        )}
                        <span className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${current ? 'bg-green text-white ring-4 ring-green-soft' : passed ? 'bg-green text-white' : 'border border-line bg-white text-muted'}`}>
                          {passed ? '✓' : step.stepNo}
                        </span>
                        {current && course ? (
                          <span className="flex min-w-0 items-center gap-2 rounded-card bg-green-soft p-2 md:flex-col md:px-3">
                            <Avatar course={course} size="size-12" />
                            <span className="line-clamp-2 text-xs font-extrabold leading-tight text-ink">Bạn đang xem</span>
                          </span>
                        ) : (
                          <span className="flex -space-x-3 pt-0.5">
                            {step.items.slice(0, 2).map(item => <Avatar key={item.itemId} course={item} size="size-9" />)}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ol>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
