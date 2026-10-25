'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getLearners, getToday } from '@/lib/today/api'
import { hasAnyEnrollment, pickLearnerId, titleFor } from '@/lib/today/learners'
import { BROWSE_HOME_URL } from '@/lib/today/links'
import type { LearnersData, TodayData } from '@/lib/today/types'
import { useNow } from '@/lib/today/useNow'
import FeeCard from '@/components/today/FeeCard'
import LearnerChips from '@/components/today/LearnerChips'
import { FeeSummary, PackageCards } from '@/components/today/PackageCards'
import { ExtraCard, LaterTodayCard, NextSessionCard } from '@/components/today/SessionCards'
import type { ActionContext } from '@/components/today/SessionButtons'
import SlotCard from '@/components/today/SlotCard'
import WeekStrip from '@/components/today/WeekStrip'
import AppPromptCard from '@/components/pwa/AppPromptCard'

const ORDER = ['order-1', 'order-2', 'order-3', 'order-4', 'order-5', 'order-6', 'order-7', 'order-8']

function Area({ order, show = true, children }: { order: number; show?: boolean; children: React.ReactNode }) {
  if (!show) return null
  return <div className={`${ORDER[order - 1]} lg:order-none`}>{children}</div>
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1100px] px-4 pb-28 pt-5 lg:px-0 lg:pb-12 lg:pt-8">{children}</div>
}

function Loading() {
  return (
    <PageFrame>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-5 h-56 animate-pulse rounded-[20px] bg-slate-200" />
    </PageFrame>
  )
}

function EmptyState() {
  return (
    <PageFrame>
      <h1 className="text-2xl font-black">Chưa có khóa học đang học</h1>
      <p className="mt-2 text-muted">Khi bạn đăng ký khóa học, lịch học sẽ hiện ở đây mỗi ngày.</p>
      <Link href={BROWSE_HOME_URL} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-blue px-5 text-[15px] font-black text-white">
        Tìm khóa học mới
      </Link>
    </PageFrame>
  )
}

function TodayContent() {
  const { user, token, isAuthLoading } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const now = useNow()
  const [learners, setLearners] = useState<LearnersData | null>(null)
  const [data, setData] = useState<TodayData | null>(null)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0)

  const wantedId = Number(search.get('child')) || null
  const selectedId = learners ? pickLearnerId(learners, wantedId) : null

  useEffect(() => {
    if (!isAuthLoading && !user) router.replace('/login?redirect=/today')
  }, [isAuthLoading, user, router])

  useEffect(() => {
    if (!token) return
    getLearners(token).then(({ data: loaded, error: err }) => {
      if (err || !loaded) return setError(err ?? 'Không tải được danh sách')
      setLearners(loaded)
    })
  }, [token])

  useEffect(() => {
    if (!token || selectedId == null) return
    let cancelled = false
    getToday(selectedId, token).then(({ data: loaded, error: err }) => {
      if (cancelled) return
      if (err || !loaded) return setError(err ?? 'Không tải được dữ liệu')
      setError('')
      setData(loaded)
    })
    return () => { cancelled = true }
  }, [token, selectedId, reloadCount])

  if (isAuthLoading || !user) return <Loading />
  if (error) return <PageFrame><p className="text-warn-text">{error}</p></PageFrame>
  if (!learners || selectedId == null) return <Loading />
  if (!hasAnyEnrollment(learners)) return <EmptyState />

  const selected = learners.learners.find(learner => learner.id === selectedId)!
  const current = data && data.learner.id === selectedId ? data : null
  const ctx: ActionContext | null = token ? { learnerId: selectedId, isSelf: selected.self, token, onChanged: () => setReloadCount(count => count + 1) } : null

  return (
    <PageFrame>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-black lg:text-3xl">{titleFor(selected.self)}</h1>
        <LearnerChips
          learners={learners.learners} selectedId={selectedId}
          onSelect={id => router.replace(`/today?child=${id}`, { scroll: false })}
        />
      </div>

      {current && ctx ? (
        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[3fr_2fr] lg:gap-5">
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <Area order={1}><NextSessionCard data={current} ctx={ctx} now={now} /></Area>
            <Area order={2} show={current.laterToday.length > 0}><LaterTodayCard sessions={current.laterToday} ctx={ctx} now={now} /></Area>
            <Area order={5}><WeekStrip key={selectedId} week={current.week} now={now} /></Area>
          </div>
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <Area order={4} show={current.fees.length > 0}>
              <div className="space-y-4">{current.fees.map(fee => <FeeCard key={fee.itemId} fee={fee} learnerId={selectedId} />)}</div>
            </Area>
            <Area order={3} show={current.extraSessions.length > 0}>
              <div className="space-y-4"><ExtraCard sessions={current.extraSessions} ctx={ctx} now={now} /></div>
            </Area>
            <Area order={6} show={current.packages.length > 0 || learners.feeDueTotal > 0}>
              <div className="space-y-4">
                {learners.learners.length > 2 || learners.feeDueTotal > 1 ? <FeeSummary feeDueTotal={learners.feeDueTotal} /> : null}
                <PackageCards packages={current.packages} learnerId={selectedId} />
              </div>
            </Area>
            <Area order={7}><SlotCard now={now} /></Area>
            <Area order={8}><AppPromptCard context="today" /></Area>
          </div>
        </div>
      ) : (
        <div className="mt-4 h-56 animate-pulse rounded-[20px] bg-slate-200" />
      )}

    </PageFrame>
  )
}

export default function TodayPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TodayContent />
    </Suspense>
  )
}
