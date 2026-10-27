'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getCourseUrl } from '@/lib/api'
import { getPathway, type Pathway } from '@/lib/api/recommendations'
import { getLearners } from '@/lib/today/api'
import type { LearnerView } from '@/lib/today/types'
import { formatMoney } from '@/lib/today/format'
import BackLink from '@/components/BackLink'
import { ListSkeleton } from '@/components/PageSkeleton'

function PathwayView() {
  const { slug } = useParams<{ slug: string }>()
  const wantedChild = Number(useSearchParams().get('child')) || null
  const { token, isAuthLoading } = useAuth()
  const [learners, setLearners] = useState<LearnerView[]>([])
  const [learnerId, setLearnerId] = useState<number | null>(wantedChild)
  const [pathway, setPathway] = useState<Pathway | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthLoading || !token) return
    getLearners(token).then(({ data }) => {
      if (!data) return
      setLearners(data.learners)
      setLearnerId(current => current ?? data.defaultLearnerId)
    })
  }, [isAuthLoading, token])

  useEffect(() => {
    if (isAuthLoading) return
    let cancelled = false
    getPathway(slug, learnerId, token).then(result => { if (!cancelled) { setPathway(result); setLoading(false) } })
    return () => { cancelled = true }
  }, [slug, learnerId, token, isAuthLoading])

  if (loading && !pathway) return <div className="container py-6"><ListSkeleton /></div>
  if (!pathway) {
    return (
      <div className="container py-10">
        <p className="text-muted">Không tìm thấy lộ trình này.</p>
        <Link href="/" className="font-bold text-green-dark no-underline">Về trang chủ</Link>
      </div>
    )
  }

  const hasLearner = learnerId != null && learners.some(learner => learner.id === learnerId)
  const nextIndex = hasLearner ? pathway.steps.findIndex(step => !step.done) : -1
  return (
    <div className="container py-6 lg:py-10">
      <BackLink href="/">Trang chủ</BackLink>
      <header className="mb-5 mt-3">
        <h1 className="m-0 text-2xl font-extrabold text-ink lg:text-3xl">{pathway.title}</h1>
        {pathway.subtitle && <p className="m-0 mt-1 text-muted">{pathway.subtitle}</p>}
        {hasLearner && <p className="m-0 mt-2 text-sm font-bold text-green-dark">Đã có {pathway.doneSteps ?? 0}/{pathway.totalSteps ?? pathway.steps.length} bước</p>}
      </header>

      {learners.length > 1 && (
        <div role="tablist" aria-label="Người học" className="mb-4 flex flex-wrap gap-2">
          {learners.map(learner => (
            <button key={learner.id} type="button" role="tab" aria-selected={learnerId === learner.id} onClick={() => setLearnerId(learner.id)}
              className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-bold ${learnerId === learner.id ? 'border-green bg-green-soft text-green-dark' : 'border-line bg-white text-text'}`}>
              {learner.self ? 'Bạn' : learner.name}
            </button>
          ))}
        </div>
      )}

      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {pathway.steps.map((step, index) => (
          <li key={step.itemId}>
            <Link href={getCourseUrl({ id: step.itemId, seoUrl: step.seoUrl ?? undefined, title: step.title })}
              className={`flex items-center gap-3 rounded-card border p-4 no-underline ${index === nextIndex ? 'border-green bg-green-soft' : 'border-line bg-white hover:bg-bg'}`}>
              <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${step.done ? 'bg-green text-white' : 'bg-bg text-muted'}`}>
                {step.done ? '✓' : step.stepNo}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wide text-muted">
                  Bước {step.stepNo}{step.done ? ' · đã có' : index === nextIndex ? ' · bước tiếp theo' : ''}
                </span>
                <span className="block text-[15px] font-extrabold text-ink">{step.title}</span>
                {step.note && <span className="block text-xs text-muted">{step.note}</span>}
              </span>
              {step.price != null && <span className="shrink-0 text-sm font-bold text-red">{formatMoney(step.price)}</span>}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function PathwayPage() {
  return (
    <Suspense fallback={<div className="container py-6"><ListSkeleton /></div>}>
      <PathwayView />
    </Suspense>
  )
}
