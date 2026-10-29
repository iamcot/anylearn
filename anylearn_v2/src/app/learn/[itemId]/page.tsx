'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getCourseUrl } from '@/lib/api'
import { getVideoOutline, playLesson, type PlayInfo, type ProgressResult, type VideoOutline } from '@/lib/api/learn'
import { clock, firstFreeLesson, LEARN_TABS, learnHref, type LearnTab } from '@/lib/learn/rules'
import LessonPlayer, { type PlayerControl } from '@/components/learn/LessonPlayer'
import LessonNotes from '@/components/learn/LessonNotes'
import CompletionModal from '@/components/learn/CompletionModal'
import StudyPlanForm from '@/components/learn/StudyPlanForm'
import VideoSuggestions from '@/components/learn/VideoSuggestions'
import { CheckIcon, ChevronLeftIcon, DownloadIcon, LockIcon, PlayIcon } from '@/components/icons'
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
  // chapters the learner opened or closed by hand (a flip of the automatic state)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [tab, setTab] = useState<LearnTab>('lessons')
  const [showDone, setShowDone] = useState(false)
  const control = useRef<PlayerControl | null>(null)

  // The player is pinned with position: sticky. `overflow-x: hidden` on body (globals.css) makes body a scroll container
  // and sticky stops working, so this page switches it to `clip` (same look, no scroll container).
  useEffect(() => {
    document.body.style.overflowX = 'clip'
    return () => { document.body.style.overflowX = '' }
  }, [])

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
    // the last open lesson just finished: say well done once and show what to learn next
    if (result.percent >= 100 && (outline?.percent ?? 0) < 100 && outline?.access && token && learnerId) setShowDone(true)
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
  const doneCount = outline?.chapters.reduce((n, c) => n + c.lessons.filter(l => l.completed).length, 0) ?? 0

  const nextOpen = !!lesson?.nextLessonId && !lesson.nextLocked
  const goNext = () => { if (lesson?.nextLessonId && nextOpen) goTo(lesson.nextLessonId) }
  const showPlan = !!token && !!outline?.access && !!learnerId

  const panel = (key: LearnTab, extra = '') => `${tab === key ? 'block' : 'hidden'} lg:block ${extra}`

  return (
    <div className="min-h-screen bg-bg pb-24 lg:pb-10">
      <div className="sticky top-0 z-40 h-[52px] border-b border-line bg-white">
        <div className="container flex h-full items-center gap-3">
          <Link href={courseUrl} className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink" aria-label="Về trang khóa học">
            <ChevronLeftIcon className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold leading-tight text-ink">{outline?.title ?? 'Khóa học video'}</div>
            {outline?.access && user && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 max-w-[200px] flex-1 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-green" style={{ width: `${percent}%` }} /></div>
                <span className="text-xs font-bold text-green-dark">{percent >= 100 ? '✓ Hoàn thành' : `${percent}%`}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid lg:container lg:grid-cols-[1fr_360px] lg:gap-x-6 lg:pt-4">
        {/* the player stays pinned under the top bar on a phone, so the list and the tabs scroll under it */}
        <div className="sticky top-[52px] z-30 min-w-0 bg-black lg:static lg:col-start-1 lg:bg-transparent">
          {lesson ? (
            <LessonPlayer key={lesson.id} lesson={lesson} token={token} learnerId={learnerId}
              mark={user?.phone ? `anyLEARN · ${user.phone.slice(-4)}` : null}
              onProgress={onProgress} controlRef={control}
              hasNext={nextOpen} onNext={goNext}
              onEnded={() => { if (nextOpen) setCountdown(5) }} />
          ) : locked ? (
            <div className="grid aspect-video place-items-center bg-white p-4 text-center lg:rounded-card lg:shadow-card">
              <div>
                <LockIcon className="mx-auto mb-2 size-7 text-muted" />
                <div className="mb-2 text-sm font-extrabold text-ink">{error}</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {!user && <button type="button" onClick={() => openAuthModal('login')} className="btn btn--outline py-2 text-sm">Đăng nhập</button>}
                  <Link href={courseUrl} className="btn btn--green py-2 text-sm">Xem khóa học</Link>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="grid aspect-video place-items-center bg-white p-4 text-center text-sm text-muted lg:rounded-card lg:shadow-card">{error}</div>
          ) : (
            <div className="aspect-video animate-pulse bg-line lg:rounded-card" />
          )}
        </div>

        <div className="min-w-0 px-4 pt-3 lg:col-start-1 lg:px-0">
          {countdown != null && lesson?.nextLessonId && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-card bg-navy p-3 text-white">
              <span className="min-w-0 truncate text-sm">Bài tiếp theo sau {countdown} giây: <b>{lesson.nextTitle}</b></span>
              <span className="flex shrink-0 gap-2">
                <button type="button" onClick={() => setCountdown(null)} className="min-h-9 text-sm text-white/80">Ở lại</button>
                <button type="button" onClick={() => goTo(lesson.nextLessonId!)} className="btn btn--green px-3 py-1.5 text-sm">Xem ngay</button>
              </span>
            </div>
          )}
          {lesson && (
            <>
              <h1 className="m-0 text-lg font-extrabold leading-snug text-ink lg:text-xl">Bài {lesson.no}: {lesson.title}</h1>
              <div className="mt-0.5 text-xs text-muted">
                {[lesson.durationSeconds ? clock(lesson.durationSeconds) : null, outline ? `Bài ${lesson.no}/${outline.totalLessons}` : null].filter(Boolean).join(' · ')}
              </div>
              {(lesson.prevLessonId || nextOpen) && (
                <div className="mt-3 hidden grid-cols-2 gap-2 lg:grid">
                  <button type="button" disabled={!lesson.prevLessonId} onClick={() => lesson.prevLessonId && goTo(lesson.prevLessonId)}
                    className="btn btn--outline min-h-11 py-2 text-sm disabled:opacity-40">‹ Bài trước</button>
                  <button type="button" disabled={!nextOpen} onClick={goNext}
                    className="btn btn--green min-h-11 py-2 text-sm disabled:opacity-40">Bài tiếp ›</button>
                </div>
              )}
            </>
          )}
          {outline?.learners && outline.learners.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Người học:</span>
              {outline.learners.map(l => (
                <Link key={l.id} href={learnHref(itemId, null, l.id)} replace
                  className={`rounded-full border px-3 py-1 font-bold no-underline ${l.id === learnerId ? 'border-green bg-green-soft text-green-dark' : 'border-line bg-white text-muted'}`}>
                  {l.self ? 'Tôi' : l.name}
                </Link>
              ))}
            </div>
          )}
          {lesson && !lesson.access && (
            <div className="mt-3 rounded-card border border-green bg-green-soft p-4">
              <div className="mb-1 font-extrabold text-green-dark">Bạn đang học thử miễn phí</div>
              <p className="mb-3 mt-0 text-sm text-text">Đăng ký khóa học để mở toàn bộ {outline?.totalLessons ?? ''} bài, học trọn đời và được nhắc lịch tự học.</p>
              <Link href={courseUrl} className="btn btn--green py-2 text-sm">Đăng ký khóa học</Link>
            </div>
          )}
        </div>

        <div role="tablist" aria-label="Nội dung trang học"
          className="sticky top-[calc(52px+56.25vw)] z-20 mt-3 flex border-b border-line bg-white lg:hidden">
          {LEARN_TABS.map(t => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
              className={`min-h-11 flex-1 border-b-2 px-1 text-[13px] font-bold ${tab === t.key ? 'border-green text-green-dark' : 'border-transparent text-muted'}`}>
              {t.label}{t.key === 'files' && lesson && lesson.attachments.length > 0 ? ` (${lesson.attachments.length})` : ''}
            </button>
          ))}
        </div>

        <aside className={panel('lessons', 'px-4 py-4 lg:col-start-2 lg:row-span-8 lg:row-start-1 lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-84px)] lg:self-start lg:overflow-y-auto lg:p-0')}>
          {percent >= 100 && outline?.access && user && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-card border border-green bg-green-soft p-3">
              <span className="text-sm font-bold text-green-dark">🎉 Bạn đã hoàn thành khóa học</span>
              <button type="button" onClick={() => setShowDone(true)} className="shrink-0 text-xs font-bold text-green-dark underline">Học tiếp khóa nào?</button>
            </div>
          )}
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-sm font-extrabold text-ink">Nội dung khóa học</span>
            {outline && <span className="text-xs text-muted">{outline.access && user ? `${doneCount}/${outline.totalLessons} bài đã học` : `${outline.totalLessons} bài`}</span>}
          </div>
          <div className="flex flex-col gap-3">
            {outline?.chapters.map((ch, ci) => {
              const holdsCurrent = ch.lessons.some(l => l.id === lesson?.id)
              const auto = outline.chapters.length <= 3 || holdsCurrent
              const open = flipped.has(ch.id) ? !auto : auto
              const done = ch.lessons.filter(l => l.completed).length
              return (
                <div key={ch.id} className="overflow-hidden rounded-card border border-line bg-white">
                  <button type="button" aria-expanded={open} onClick={() => setFlipped(f => { const n = new Set(f); if (n.has(ch.id)) n.delete(ch.id); else n.add(ch.id); return n })}
                    className="flex w-full items-center justify-between gap-2 bg-bg px-3 py-2.5 text-left">
                    <span className="min-w-0 truncate text-xs font-extrabold text-ink">Chương {ci + 1}: {ch.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted">
                      {outline.access && user ? `${done}/${ch.lessons.length}` : `${ch.lessons.length} bài`}
                      <span aria-hidden className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                    </span>
                  </button>
                  {open && (
                    <ul className="m-0 list-none p-0">
                      {ch.lessons.map(l => {
                        no += 1
                        const current = l.id === lesson?.id
                        const playable = !l.locked && l.playable
                        return (
                          <li key={l.id}>
                            <button type="button" disabled={!playable} onClick={() => goTo(l.id)}
                              className={`flex min-h-12 w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-left ${current ? 'bg-green-soft' : ''} ${playable ? '' : 'opacity-60'}`}>
                              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${l.completed ? 'bg-green text-white' : current ? 'bg-white text-green-dark' : 'bg-bg text-muted'}`}>
                                {l.completed ? <CheckIcon className="size-3.5" /> : current ? <PlayIcon className="size-3" /> : no}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className={`block text-sm leading-snug ${current ? 'font-extrabold text-green-dark' : 'font-semibold text-ink'}`}>{l.title}</span>
                                <span className="text-[11px] text-muted">
                                  {current ? 'Đang học · ' : ''}{l.durationSeconds ? clock(l.durationSeconds) : l.type === 'text' ? 'Bài đọc' : ''}
                                  {l.free && !outline.access ? ' · Học thử' : ''}{!l.playable ? ' · sắp có' : ''}
                                </span>
                              </span>
                              {l.locked && <LockIcon className="size-4 shrink-0 text-subtle" />}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
          {showPlan && percent >= SUGGEST_FROM_PERCENT && (
            <div className="lg:hidden"><VideoSuggestions token={token!} itemId={itemId} learnerId={learnerId!} done={percent >= 100} /></div>
          )}
        </aside>

        <section className={panel('about', 'min-w-0 px-4 py-4 lg:col-start-1 lg:px-0')}>
          <h2 className="mb-2 mt-0 text-sm font-extrabold text-ink">Về bài này</h2>
          {lesson?.description
            ? <p className="m-0 whitespace-pre-line leading-[1.7] text-text">{lesson.description}</p>
            : <p className="m-0 text-sm text-muted">Bài này chưa có phần mô tả.</p>}
          {lesson && token && (
            <LessonNotes token={token} lessonId={lesson.id} learnerId={learnerId} timed={lesson.type === 'video'} control={control}
              onJump={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          )}
          {lesson && !token && <p className="mb-0 mt-4 text-sm text-muted">Đăng nhập để ghi chú theo từng thời điểm của video.</p>}
        </section>

        <section className={panel('files', 'min-w-0 px-4 py-4 lg:col-start-1 lg:px-0')}>
          <h2 className="mb-2 mt-0 text-sm font-extrabold text-ink">Tài liệu kèm bài</h2>
          {lesson && lesson.attachments.length > 0 ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {lesson.attachments.map(a => (
                <li key={a.url}>
                  <a href={a.url} target="_blank" rel="noreferrer" className="flex min-h-12 items-center gap-3 rounded-card border border-line bg-white p-3 text-ink no-underline">
                    <DownloadIcon className="size-5 shrink-0 text-green" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{a.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : <p className="m-0 text-sm text-muted">Bài này chưa có tài liệu đính kèm.</p>}
        </section>

        <section className={panel('plan', 'min-w-0 px-4 py-4 lg:col-start-1 lg:px-0')}>
          <h2 className="mb-2 mt-0 text-sm font-extrabold text-ink">Lịch tự học</h2>
          {showPlan
            ? <StudyPlanForm token={token!} learnerId={learnerId!} itemId={itemId} />
            : <p className="m-0 text-sm text-muted">Đăng ký khóa học để đặt lịch tự học, anyLEARN sẽ nhắc đúng giờ.</p>}
          {showPlan && percent >= SUGGEST_FROM_PERCENT && (
            <div className="hidden lg:block"><VideoSuggestions token={token!} itemId={itemId} learnerId={learnerId!} done={percent >= 100} /></div>
          )}
        </section>
      </div>

      {/* phone: previous / next always in reach */}
      {lesson && outline && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-line bg-white px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 lg:hidden">
          <button type="button" aria-label="Bài trước" disabled={!lesson.prevLessonId} onClick={() => lesson.prevLessonId && goTo(lesson.prevLessonId)}
            className="btn btn--outline min-h-11 px-4 py-2 text-sm disabled:opacity-40">‹</button>
          <div className="min-w-0 flex-1 text-center leading-tight">
            <div className="text-xs font-extrabold text-ink">Bài {lesson.no} / {outline.totalLessons}</div>
            <div className="truncate text-[11px] text-muted">{nextOpen ? `Tiếp: ${lesson.nextTitle}` : lesson.nextLessonId ? 'Đăng ký để mở bài tiếp' : 'Bài cuối'}</div>
          </div>
          <button type="button" aria-label="Bài tiếp" disabled={!nextOpen} onClick={goNext}
            className="btn btn--green min-h-11 px-5 py-2 text-sm disabled:opacity-40">Tiếp ›</button>
        </div>
      )}

      {showDone && token && learnerId && (
        <CompletionModal token={token} itemId={itemId} learnerId={learnerId} courseTitle={outline?.title ?? 'video'}
          onClose={() => setShowDone(false)}
          onReplay={() => { setShowDone(false); const first = outline?.chapters[0]?.lessons[0]; if (first) goTo(first.id) }} />
      )}
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={<LearnSkeleton />}><LearnPage /></Suspense>
}
