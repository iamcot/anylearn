'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import AiCourseCard from '@/components/aisuggest/AiCourseCard'
import AiFeedbackBar from '@/components/aisuggest/AiFeedbackBar'
import AiLoadingStage from '@/components/aisuggest/AiLoadingStage'
import LearnerChips from '@/components/today/LearnerChips'
import { AI_SUGGEST_PATH, MIN_LOADING_MS } from '@/config/aiSuggest'
import { useAuth } from '@/context/AuthContext'
import { runAiSuggest, type AiSuggestResult } from '@/lib/api/aiSuggest'
import { getLearners } from '@/lib/today/api'
import { pickLearnerId } from '@/lib/today/learners'
import { BROWSE_HOME_URL } from '@/lib/today/links'
import type { LearnersData } from '@/lib/today/types'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">
      <Link href={BROWSE_HOME_URL} className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-muted no-underline hover:text-ink">
        <span aria-hidden>‹</span> Về trang chủ
      </Link>
      {children}
    </div>
  )
}

function GuestView() {
  return (
    <Frame>
      <div className="mx-auto max-w-[520px] py-10 text-center">
        <div aria-hidden className="text-6xl">🔮</div>
        <h1 className="mt-4 text-2xl font-black text-ink">Đăng nhập để nhận gợi ý bằng AI</h1>
        <p className="mt-2 text-muted">Câu trả lời về sở thích của bạn đã được lưu trên máy này và sẽ tự cập nhật vào tài khoản khi bạn đăng nhập hoặc đăng ký.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href={`/login?redirect=${AI_SUGGEST_PATH}`} className="btn btn--green text-sm">Đăng nhập</Link>
          <Link href={`/register?redirect=${AI_SUGGEST_PATH}`} className="btn btn--outline text-sm">Đăng ký</Link>
        </div>
      </div>
    </Frame>
  )
}

function SuggestContent() {
  const { user, token, isAuthLoading } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const wanted = Number(search.get('learner')) || null

  const [learners, setLearners] = useState<LearnersData | null>(null)
  const [result, setResult] = useState<{ learnerId: number; data: AiSuggestResult } | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    getLearners(token).then(({ data }) => { if (!cancelled && data) setLearners(data) })
    return () => { cancelled = true }
  }, [token])

  const selectedId = learners ? pickLearnerId(learners, wanted) : null
  const selected = learners?.learners.find(item => item.id === selectedId)
  const current = result && result.learnerId === selectedId ? result.data : null

  useEffect(() => {
    if (!token || selectedId == null) return
    let cancelled = false
    const started = Date.now()
    runAiSuggest(selectedId, token).then(async ({ data, error: problem }) => {
      // Even a saved answer shows the stage for a moment, so the lines can be read.
      const wait = MIN_LOADING_MS - (Date.now() - started)
      if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait))
      if (cancelled) return
      if (problem || !data) return setError(problem ?? 'Không tạo được gợi ý, bạn thử lại nhé')
      setError('')
      setResult({ learnerId: selectedId, data })
    })
    return () => { cancelled = true }
  }, [token, selectedId, attempt])

  if (isAuthLoading) return <Frame><div className="h-56 animate-pulse rounded-[20px] bg-slate-200" /></Frame>
  if (!user || !token) return <GuestView />
  if (error) {
    return (
      <Frame>
        <div className="py-12 text-center">
          <p className="text-warn-text">{error}</p>
          <button type="button" className="btn btn--green mt-4 text-sm" onClick={() => { setError(''); setAttempt(n => n + 1) }}>Thử lại</button>
        </div>
      </Frame>
    )
  }
  if (!current || !selected) return <Frame><AiLoadingStage name={selected ? (selected.self ? 'bạn' : selected.name) : 'bạn'} done={false} /></Frame>

  return (
    <Frame>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="m-0 text-2xl font-black text-ink lg:text-3xl"><span aria-hidden>✨ </span>Gợi ý hôm nay cho {selected.self ? 'bạn' : selected.name}</h1>
          <p className="m-0 mt-1 text-sm text-muted">
            {current.ai ? 'AI chọn riêng theo độ tuổi, sở thích và lịch học. Mỗi ngày một danh sách mới.' : 'Gợi ý theo độ tuổi, sở thích và lịch học.'}
          </p>
        </div>
        {learners && learners.learners.length > 1 && (
          <LearnerChips learners={learners.learners} selectedId={selected.id} onSelect={id => router.replace(`${AI_SUGGEST_PATH}?learner=${id}`, { scroll: false })} />
        )}
      </div>

      {current.items.length === 0 ? (
        <p className="mt-8 text-center text-muted">Chưa có khóa học nào hợp lúc này. Bạn thử tìm kiếm thêm nhé.</p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {current.items.map(rec => <AiCourseCard key={rec.itemId} rec={rec} token={token} />)}
        </div>
      )}

      {current.suggestionId != null && (
        <AiFeedbackBar key={current.suggestionId} suggestionId={current.suggestionId} token={token} initialRating={current.feedback?.rating} />
      )}

      <div className="mt-8 flex justify-center">
        <Link href="/search" className="btn btn--green min-h-11 text-sm">Tìm kiếm thêm</Link>
      </div>
    </Frame>
  )
}

export default function AiSuggestPage() {
  return (
    <Suspense fallback={<Frame><div className="h-56 animate-pulse rounded-[20px] bg-slate-200" /></Frame>}>
      <SuggestContent />
    </Suspense>
  )
}
