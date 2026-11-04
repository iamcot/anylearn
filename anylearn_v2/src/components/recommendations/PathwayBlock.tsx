'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getItemPathways, getItemPathwaysForAccount, type Pathway, type PathwayCourse } from '@/lib/api/recommendations'
import { getLearners } from '@/lib/today/api'

function Avatar({ course, size }: { course: PathwayCourse; size: string }) {
  const style = `${size} shrink-0 rounded-full border-2 border-white bg-bg object-cover`
  // eslint-disable-next-line @next/next/no-img-element
  return course.image ? <img src={course.image} alt="" loading="lazy" className={style} /> : <span className={`${style} inline-block`} />
}

/** "Lộ trình học" on the course page (left column on a desktop): a vertical bar of the steps of the chain.
 *  This course's step is the big one; the others show every course of the step as a picture (a bought one says "Bạn đã mua"). The whole card opens the pathway page (plan 08.1). */
export default function PathwayBlock({ itemId }: { itemId: number }) {
  const [pathways, setPathways] = useState<Pathway[]>([])

  const { token, isAuthLoading } = useAuth()

  useEffect(() => {
    if (isAuthLoading) return
    let cancelled = false
    const show = (list: Pathway[]) => { if (!cancelled) setPathways(list.filter(p => p.steps.length >= 2)) }
    getItemPathways(itemId).then(show)
    // Signed in: ask again with the account's learners so a course they already bought is marked.
    if (token) {
      getLearners(token).then(async ({ data }) => {
        const ids = data?.learners.map(learner => learner.id) ?? []
        if (ids.length > 0) show(await getItemPathwaysForAccount(itemId, ids, token))
      })
    }
    return () => { cancelled = true }
  }, [itemId, token, isAuthLoading])

  if (pathways.length === 0) return null
  return (
    <div>
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
                <ol className="m-0 flex list-none flex-col p-0">
                  {pathway.steps.map((step, index) => {
                    const current = index === currentIndex
                    const course = step.items.find(item => item.itemId === itemId) ?? step.items[0]
                    const bought = step.items.find(item => item.owned)
                    // Ticked only when a course of the step is bought (for the viewed step: this course). Every other step is a number on a pale dot.
                    const passed = current ? !!course?.owned : !!bought
                    return (
                      <li key={step.stepNo} aria-current={current ? 'step' : undefined}
                        className="relative flex min-w-0 gap-3 pb-5 last:pb-0">
                        {index < pathway.steps.length - 1 && (
                          <span aria-hidden="true" className={`absolute left-[13px] top-7 h-full w-[3px] ${passed ? 'bg-green' : 'bg-line'}`} />
                        )}
                        <span className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${current ? 'bg-green text-white ring-4 ring-green-soft' : passed ? 'bg-green text-white' : 'border border-line bg-bg text-muted'}`}>
                          {passed ? '✓' : step.stepNo}
                        </span>
                        {current && course ? (
                          <span className="flex min-w-0 items-center gap-2 rounded-card bg-green-soft p-2">
                            <Avatar course={course} size="size-12" />
                            <span className="line-clamp-2 text-xs font-extrabold leading-tight text-ink">Bạn đang xem{course.owned ? ' · đã mua' : ''}</span>
                          </span>
                        ) : bought ? (
                          <span className="flex min-w-0 items-center gap-2 rounded-card bg-green-soft p-2">
                            <Avatar course={bought} size="size-12" />
                            <span className="line-clamp-2 text-xs font-extrabold leading-tight text-ink">Bạn đã mua</span>
                          </span>
                        ) : (
                          <span className="flex min-w-0 gap-1 overflow-x-auto pt-0.5 [scrollbar-width:none]">
                            {step.items.map(item => <Avatar key={item.itemId} course={item} size="size-9" />)}
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
  )
}
