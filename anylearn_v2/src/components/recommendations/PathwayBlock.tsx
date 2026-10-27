'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCourseUrl } from '@/lib/api'
import { getItemPathways, type Pathway } from '@/lib/api/recommendations'
import { formatMoney } from '@/lib/today/format'

/** "Lộ trình học" on the course page: the chain this course belongs to, the current step highlighted (plan 08.1). */
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
                <Link href={`/pathway/${pathway.slug}`} className="text-sm font-bold text-blue no-underline">Xem toàn bộ lộ trình</Link>
              </div>
              <ol className="m-0 flex list-none flex-col gap-3 p-0 md:flex-row">
                {pathway.steps.map(step => {
                  const current = step.itemId === itemId
                  return (
                    <li key={step.itemId} className="md:flex-1">
                      <Link href={getCourseUrl({ id: step.itemId, seoUrl: step.seoUrl ?? undefined, title: step.title })}
                        aria-current={current ? 'step' : undefined}
                        className={`flex h-full flex-col gap-1 rounded-card border p-4 no-underline ${current ? 'border-blue bg-blue-soft' : 'border-line bg-white hover:bg-bg'}`}>
                        <span className="text-xs font-bold uppercase tracking-wide text-muted">Bước {step.stepNo}{current ? ' · bạn đang xem' : ''}</span>
                        <span className="text-sm font-extrabold text-ink">{step.title}</span>
                        {step.note && <span className="text-xs text-muted">{step.note}</span>}
                        {step.price != null && <span className="mt-auto pt-1 text-sm font-bold text-red">{formatMoney(step.price)}</span>}
                      </Link>
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
