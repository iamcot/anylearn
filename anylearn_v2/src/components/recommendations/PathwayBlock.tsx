'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCourseUrl } from '@/lib/api'
import { getItemPathways, type Pathway } from '@/lib/api/recommendations'

/** "Lộ trình học" on the course page: the chain this course belongs to, the step of this course highlighted (plan 08.1). */
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
        <div className="space-y-6">
          {pathways.map(pathway => (
            <div key={pathway.id}>
              <div className="mb-3">
                <div className="text-base font-extrabold text-ink">{pathway.title}</div>
                {pathway.subtitle && <div className="text-sm text-muted">{pathway.subtitle}</div>}
                <Link href={`/pathway/${pathway.slug}`} className="text-sm font-bold text-green-dark no-underline">Xem toàn bộ lộ trình</Link>
              </div>
              <ol className="m-0 flex list-none flex-col gap-3 p-0 md:flex-row">
                {pathway.steps.map(step => {
                  const current = step.items.some(item => item.itemId === itemId)
                  return (
                    <li key={step.stepNo} className="md:flex-1">
                      <div aria-current={current ? 'step' : undefined}
                        className={`flex h-full flex-col gap-1 rounded-card border p-4 ${current ? 'border-green bg-green-soft' : 'border-line bg-white'}`}>
                        <span className="text-xs font-bold uppercase tracking-wide text-muted">Bước {step.stepNo}{current ? ' · bạn đang xem' : ''}</span>
                        {step.note && <span className="text-xs text-muted">{step.note}</span>}
                        {step.items.map(item => (
                          <Link key={item.itemId} href={getCourseUrl({ id: item.itemId, seoUrl: item.seoUrl ?? undefined, title: item.title })}
                            className={`text-sm no-underline ${item.itemId === itemId ? 'font-extrabold text-ink' : 'font-bold text-green-dark'}`}>
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
