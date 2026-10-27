'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getCourseUrl } from '@/lib/api'
import { getPathway, restartPathwayStep, type Pathway, type PathwayCourse, type PathwayStep } from '@/lib/api/recommendations'
import { getLearners } from '@/lib/today/api'
import type { LearnerView } from '@/lib/today/types'
import { formatMoney } from '@/lib/today/format'
import BackLink from '@/components/BackLink'
import { ListSkeleton } from '@/components/PageSkeleton'

const TAG = 'rounded-full px-2 py-0.5 text-[11px] font-bold'

function CourseCard({ course }: { course: PathwayCourse }) {
  return (
    <Link href={getCourseUrl({ id: course.itemId, seoUrl: course.seoUrl ?? undefined, title: course.title })}
      className={`flex w-[220px] shrink-0 snap-start flex-col gap-2 rounded-card border p-3 no-underline ${course.owned ? 'border-green bg-green-soft' : 'border-line bg-white hover:bg-bg'}`}>
      {course.image
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={course.image} alt="" className="h-[110px] w-full rounded-lg object-cover" />
        : <div className="h-[110px] w-full rounded-lg bg-bg" />}
      <div className="flex flex-wrap gap-1">
        {course.owned && <span className={`${TAG} bg-green text-white`}>✓ Đã có</span>}
        {course.related && !course.owned && <span className={`${TAG} bg-green-soft text-green-dark`}>Liên quan</span>}
      </div>
      <span className="text-sm font-extrabold leading-snug text-ink">{course.title}</span>
      {course.price != null && <span className="mt-auto text-sm font-bold text-red">{formatMoney(course.price)}</span>}
    </Link>
  )
}

function StepRow({ step, canRestart, onRestart }: { step: PathwayStep; canRestart: boolean; onRestart: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const owned = step.items.filter(item => item.owned)
  // A finished step shows only what the learner chose, with a button to look at the other courses of the step.
  const collapsed = step.done && !expanded
  const shown = collapsed ? owned : step.items
  const hidden = step.items.length - owned.length

  return (
    <li className="group relative pl-11">
      <span aria-hidden="true" className={`absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-[3px] group-last:hidden ${step.done ? 'bg-green' : 'bg-line'}`} />
      <span className={`absolute left-0 top-0 grid size-8 place-items-center rounded-full text-sm font-extrabold ${step.done ? 'bg-green text-white' : step.next ? 'bg-green text-white ring-4 ring-green-soft' : 'border border-line bg-white text-muted'}`}>
        {step.done ? '✓' : step.stepNo}
      </span>
      <div className="mb-3 flex min-h-8 flex-wrap items-center gap-2">
        <span className="text-base font-extrabold text-ink">Bước {step.stepNo}</span>
        {step.done && <span className={`${TAG} bg-green-soft text-green-dark`}>Đã xong</span>}
        {step.next && <span className={`${TAG} bg-green text-white`}>Bước tiếp theo</span>}
        {step.restarted && !step.done && <span className={`${TAG} bg-green-soft text-green-dark`}>Đang quay lại bước này</span>}
        {step.skipped && <span className={`${TAG} border border-warn-line bg-warn-soft text-warn-text`}>Bạn đã bỏ qua bước này</span>}
        {step.skipped && canRestart && (
          <button type="button" onClick={onRestart}
            className="min-h-9 cursor-pointer rounded-full border border-line bg-white px-3 text-xs font-bold text-green-dark hover:bg-bg">
            Đặt lại từ bước này
          </button>
        )}
      </div>
      {step.note && <p className="m-0 mb-3 text-sm text-muted">{step.note}</p>}
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {shown.map(course => <CourseCard key={course.itemId} course={course} />)}
      </div>
      {step.done && hidden > 0 && (
        <button type="button" onClick={() => setExpanded(open => !open)}
          className="mt-1 min-h-9 cursor-pointer border-0 bg-transparent p-0 text-sm font-bold text-green-dark">
          {expanded ? 'Thu gọn' : `Xem ${hidden} khóa khác cùng bước này`}
        </button>
      )}
    </li>
  )
}

function PathwayView() {
  const { slug } = useParams<{ slug: string }>()
  const wantedChild = Number(useSearchParams().get('child')) || null
  const { token, isAuthLoading } = useAuth()
  const [learners, setLearners] = useState<LearnerView[]>([])
  const [learnerId, setLearnerId] = useState<number | null>(wantedChild)
  const [pathway, setPathway] = useState<Pathway | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthLoading || !token) return
    getLearners(token).then(({ data }) => {
      if (!data) return
      setLearners(data.learners)
      setLearnerId(current => current ?? data.defaultLearnerId)
    })
  }, [isAuthLoading, token])

  const load = useCallback(() => getPathway(slug, learnerId, token).then(result => { setPathway(result); setLoading(false) }), [slug, learnerId, token])

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
  async function restart(stepNo: number) {
    if (!token || learnerId == null) return
    setError('')
    const { error: err } = await restartPathwayStep(slug, learnerId, stepNo, token)
    if (err) return setError(err)
    await load()
  }

  return (
    <div className="container py-6 lg:py-10">
      <BackLink href="/">Trang chủ</BackLink>
      <header className="mb-5 mt-3">
        <h1 className="m-0 text-2xl font-extrabold text-ink lg:text-3xl">{pathway.title}</h1>
        {pathway.subtitle && <p className="m-0 mt-1 text-muted">{pathway.subtitle}</p>}
        {hasLearner && <p className="m-0 mt-2 text-sm font-bold text-green-dark">Đã qua {pathway.doneSteps ?? 0}/{pathway.totalSteps ?? pathway.steps.length} bước</p>}
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
      {error && <p role="alert" className="mb-3 text-sm text-red">{error}</p>}

      <ol className="m-0 flex list-none flex-col gap-6 p-0">
        {pathway.steps.map(step => (
          <StepRow key={`${learnerId}-${step.stepNo}`} step={step} canRestart={hasLearner} onRestart={() => restart(step.stepNo)} />
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
