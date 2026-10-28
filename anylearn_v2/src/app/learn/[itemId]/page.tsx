'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getCourseUrl } from '@/lib/api'
import { getVideoOutline, playLesson, type PlayInfo, type ProgressResult, type VideoOutline } from '@/lib/api/learn'
import { clock, firstFreeLesson, learnHref } from '@/lib/learn/rules'
import LessonPlayer from '@/components/learn/LessonPlayer'
import StudyPlanForm from '@/components/learn/StudyPlanForm'
import VideoSuggestions from '@/components/learn/VideoSuggestions'
import { CheckIcon, ChevronLeftIcon, LockIcon, PlayIcon } from '@/components/icons'
import { LearnSkeleton } from '@/components/PageSkeleton'

const SUGGEST_FROM_PERCENT = 80

function LearnPage() {
  const { itemId: raw } = useParams<{ itemId: string }>()
  const itemId = Number(raw)
  const search = useSearchParams()
  const router = useRouter()
  const { user, token, isAuthLoading, openAuthModal } = useAuth()
  const learnerParam = Number(search.get('learner')) || null
  const lessonParam = Number(search.get('lesson')) || null

  const [outline, setOutline] = useState<VideoOutline | null>(null)
  const [lesson, setLesson] = useState<PlayInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  const learnerId = learnerParam ?? outline?.learnerId ?? null

  const reloadOutline = useCallback(() => {
    getVideoOutline(itemId, token, learnerParam).then(res => {
      if (res.data) setOutline(res.data)
      else setError(res.error ?? 'Không tải được khóa học')
    })
  }, [itemId, token, learnerParam])

  useEffect(() => {
    if (isAuthLoading) return
    reloadOutline()
  }, [isAuthLoading, reloadOutline])

  // the lesson to open: the one in the address, else where the learner stopped, else the first free lesson
  const lessonId = lessonParam ?? (outline
    ? (outline.access ? outline.resumeLessonId ?? null : firstFreeLesson(outline.chapters)?.id ?? outline.chapters[0]?.lessons[0]?.id ?? null)
    : null)

  useEffect(() => {
    if (isAuthLoading || !lessonId) return
    let cancelled = false
    playLesson(lessonId, token, learnerId).then(res => {
      if (cancelled) return
      setCountdown(null)
      setLesson(res.data)
      setError(res.data ? null : res.error ?? 'Không mở được bài học')
    })
    return () => { cancelled = true }
  }, [lessonId, token, learnerId, isAuthLoading])

  const goTo = useCallback((id: number) => {
    router.replace(learnHref(itemId, id, learnerParam), { scroll: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [router, itemId, learnerParam])

  // "Bài tiếp theo" after a lesson ends: 5 seconds, then the next one
  useEffect(() => {
    if (countdown == null || !lesson?.nextLessonId) return
    if (countdown <= 0) { goTo(lesson.nextLessonId); return }
    const t = window.setTimeout(() => setCountdown(c => (c == null ? null : c - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [countdown, lesson, goTo])

  const onProgress = (result: ProgressResult) => {
    setOutline(o => o && ({
      ...o,
      percent: result.percent,
      chapters: o.chapters.map(c => ({ ...c, lessons: c.lessons.map(l => (l.id === lesson?.id && result.completed ? { ...l, completed: true } : l)) })),
    }))
    if (result.completed && lesson && !lesson.completed) setLesson({ ...lesson, completed: true })
  }

  if (!outline && !error) return <LearnSkeleton />
  const courseUrl = outline?.title ? getCourseUrl({ id: itemId, seoUrl: outline.seoUrl ?? undefined, title: outline.title }) : '/'
  const percent = outline?.percent ?? 0
  const locked = error && lesson == null && lessonId != null && outline && !outline.access
  let no = 0

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="container flex items-center gap-3 py-2.5">
          <Link href={courseUrl} className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink" aria-label="Về trang khóa học">
            <ChevronLeftIcon className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold text-ink">{outline?.title ?? 'Khóa học video'}</div>
            {outline?.access && user && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 max-w-[200px] flex-1 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-green" style={{ width: `${percent}%` }} /></div>
                <span className="text-xs font-bold text-green-dark">{percent}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container grid gap-6 pt-4 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {outline?.learners && outline.learners.length > 1 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Người học:</span>
              {outline.learners.map(l => (
                <Link key={l.id} href={learnHref(itemId, null, l.id)} replace
                  className={`rounded-full border px-3 py-1 font-bold no-underline ${l.id === learnerId ? 'border-green bg-green-soft text-green-dark' : 'border-line bg-white text-muted'}`}>
                  {l.self ? 'Tôi' : l.name}
                </Link>
              ))}
            </div>
          )}

          {lesson ? (
            <>
              <LessonPlayer key={lesson.id} lesson={lesson} token={token} learnerId={learnerId}
                mark={user?.phone ? `anyLEARN · ${user.phone.slice(-4)}` : null}
                onProgress={onProgress}
                onEnded={() => { if (lesson.nextLessonId && !lesson.nextLocked) setCountdown(5) }} />
              {countdown != null && lesson.nextLessonId && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-card bg-navy p-3 text-white">
                  <span className="min-w-0 truncate text-sm">Bài tiếp theo sau {countdown} giây: <b>{lesson.nextTitle}</b></span>
                  <span className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setCountdown(null)} className="text-sm text-white/80">Ở lại</button>
                    <button type="button" onClick={() => goTo(lesson.nextLessonId!)} className="btn btn--green px-3 py-1.5 text-sm">Xem ngay</button>
                  </span>
                </div>
              )}
              <h1 className="mb-1 mt-4 text-xl font-extrabold text-ink">Bài {lesson.no}: {lesson.title}</h1>
              {lesson.durationSeconds ? <div className="mb-3 text-sm text-muted">{clock(lesson.durationSeconds)}</div> : null}
              {lesson.description && <p className="whitespace-pre-line leading-[1.7] text-text">{lesson.description}</p>}
              {lesson.attachments.length > 0 && (
                <div className="mt-4 rounded-card border border-line bg-white p-3">
                  <div className="mb-2 text-sm font-bold text-ink">Tài liệu kèm bài</div>
                  <ul className="m-0 list-none p-0">
                    {lesson.attachments.map(a => <li key={a.url}><a href={a.url} target="_blank" rel="noreferrer" className="text-sm text-blue">{a.name}</a></li>)}
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {lesson.prevLessonId && <button type="button" onClick={() => goTo(lesson.prevLessonId!)} className="btn btn--outline py-2 text-sm">‹ Bài trước</button>}
                {lesson.nextLessonId && !lesson.nextLocked && <button type="button" onClick={() => goTo(lesson.nextLessonId!)} className="btn btn--green py-2 text-sm">Bài tiếp ›</button>}
              </div>
              {!lesson.access && (
                <div className="mt-5 rounded-card border border-green bg-green-soft p-4">
                  <div className="mb-1 font-extrabold text-green-dark">Bạn đang học thử miễn phí</div>
                  <p className="mb-3 text-sm text-text">Đăng ký khóa học để mở toàn bộ {outline?.totalLessons ?? ''} bài, học trọn đời và được nhắc lịch tự học.</p>
                  <Link href={courseUrl} className="btn btn--green py-2 text-sm">Đăng ký khóa học</Link>
                </div>
              )}
            </>
          ) : locked ? (
            <div className="rounded-card bg-white p-6 text-center shadow-card">
              <LockIcon className="mx-auto mb-3 size-8 text-muted" />
              <div className="mb-2 font-extrabold text-ink">{error}</div>
              <div className="flex flex-wrap justify-center gap-2">
                {!user && <button type="button" onClick={() => openAuthModal('login')} className="btn btn--outline py-2 text-sm">Đăng nhập</button>}
                <Link href={courseUrl} className="btn btn--green py-2 text-sm">Xem khóa học</Link>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-card bg-white p-6 text-center text-sm text-muted shadow-card">{error}</div>
          ) : (
            <div className="aspect-video animate-pulse rounded-card bg-line" />
          )}

          {token && outline?.access && learnerId && (
            <div className="mt-5"><StudyPlanForm token={token} learnerId={learnerId} itemId={itemId} /></div>
          )}
          {token && outline?.access && learnerId && percent >= SUGGEST_FROM_PERCENT && (
            <VideoSuggestions token={token} itemId={itemId} learnerId={learnerId} done={percent >= 100} />
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
          <div className="mb-2 text-sm font-extrabold text-ink">
            Nội dung khóa học{outline ? ` · ${outline.totalLessons} bài` : ''}
          </div>
          <div className="flex flex-col gap-3">
            {outline?.chapters.map((ch, ci) => (
              <div key={ch.id} className="overflow-hidden rounded-card border border-line bg-white">
                <div className="bg-bg px-3 py-2 text-xs font-extrabold text-ink">Chương {ci + 1}: {ch.title}</div>
                <ul className="m-0 list-none p-0">
                  {ch.lessons.map(l => {
                    no += 1
                    const current = l.id === lesson?.id
                    const open = !l.locked && l.playable
                    return (
                      <li key={l.id}>
                        <button type="button" disabled={!open} onClick={() => goTo(l.id)}
                          className={`flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-left ${current ? 'bg-green-soft' : ''} ${open ? '' : 'opacity-60'}`}>
                          <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${l.completed ? 'bg-green text-white' : current ? 'bg-white text-green-dark' : 'bg-bg text-muted'}`}>
                            {l.completed ? <CheckIcon className="size-3.5" /> : current ? <PlayIcon className="size-3" /> : no}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm ${current ? 'font-extrabold text-green-dark' : 'font-semibold text-ink'}`}>{l.title}</span>
                            <span className="text-[11px] text-muted">
                              {l.durationSeconds ? clock(l.durationSeconds) : l.type === 'text' ? 'Bài đọc' : ''}
                              {l.free && !outline.access ? ' · Học thử' : ''}{!l.playable ? ' · sắp có' : ''}
                            </span>
                          </span>
                          {l.locked && <LockIcon className="size-4 shrink-0 text-subtle" />}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={<LearnSkeleton />}><LearnPage /></Suspense>
}
