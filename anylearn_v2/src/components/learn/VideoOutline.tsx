'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getVideoOutline, type VideoOutline as Outline } from '@/lib/api/learn'
import { clock, firstFreeLesson, learnHref, resumeLabel } from '@/lib/learn/rules'
import { CheckIcon, ChevronDownIcon, LockIcon, PlayIcon } from '@/components/icons'

// The hero button and the outline section ask at the same time: share one request per course and token for a few seconds.
const pending = new Map<string, { at: number; promise: ReturnType<typeof getVideoOutline> }>()
function loadOutline(itemId: number, token: string | null) {
  const key = `${itemId}:${token ?? ''}`
  const hit = pending.get(key)
  if (hit && Date.now() - hit.at < 5000) return hit.promise
  const promise = getVideoOutline(itemId, token)
  pending.set(key, { at: Date.now(), promise })
  return promise
}

/** Loads the outline of a video course for the person on the page (progress and access when signed in). */
function useOutline(itemId: number) {
  const { token, isAuthLoading } = useAuth()
  const [outline, setOutline] = useState<Outline | null>(null)
  useEffect(() => {
    if (isAuthLoading) return
    let cancelled = false
    loadOutline(itemId, token).then(res => { if (!cancelled) setOutline(res.data) })
    return () => { cancelled = true }
  }, [itemId, token, isAuthLoading])
  return outline
}

/**
 * Next to the register button of a video course: "Học tiếp" with the progress bar for a person who has the course,
 * otherwise "Học thử miễn phí" when a lesson is free.
 */
export function VideoHeroCta({ itemId }: { itemId: number }) {
  const outline = useOutline(itemId)
  if (!outline) return null
  if (outline.access && outline.totalLessons > 0) {
    return (
      <div className="mb-4 rounded-card border border-green bg-green-soft p-3">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-green-dark">
          <span>{outline.learners && outline.learners.length > 1 ? `${outline.learnerName} đã học` : 'Bạn đã học'} {outline.percent ?? 0}%</span>
          <span className="text-xs font-semibold text-muted">{outline.doneLessons ?? 0}/{outline.countedLessons ?? 0} bài</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-green" style={{ width: `${outline.percent ?? 0}%` }} /></div>
        <Link href={learnHref(itemId, outline.resumeLessonId, outline.learnerId)} className="btn btn--green w-full justify-center py-3">
          <PlayIcon className="size-4" /> <span className="truncate">{resumeLabel(outline)}</span>
        </Link>
      </div>
    )
  }
  const free = firstFreeLesson(outline.chapters)
  if (!free) return null
  return (
    <Link href={learnHref(itemId, free.id)} className="btn btn--outline mb-3 w-full justify-center py-3">
      <PlayIcon className="size-4" /> Học thử miễn phí
    </Link>
  )
}

/** "Nội dung khóa học": every chapter and lesson, "Học thử" on free lessons, a lock on paid ones, ✓ on finished ones. */
export default function VideoOutline({ itemId }: { itemId: number }) {
  const outline = useOutline(itemId)
  const [closed, setClosed] = useState<Record<number, boolean>>({})
  if (!outline || outline.totalLessons === 0) return null
  let no = 0
  return (
    <section className="section" id="video-outline">
      <div className="container max-w-3xl">
        <span className="section-kicker">Khóa học video</span>
        <h2 className="section-title mb-2">Nội dung khóa học</h2>
        <p className="mb-5 text-sm text-muted">
          {outline.totalChapters} chương · {outline.totalLessons} bài{outline.durationText ? ` · ${outline.durationText}` : ''}
          {outline.freeLessons > 0 && !outline.access ? ` · ${outline.freeLessons} bài học thử miễn phí` : ''}
        </p>
        <div className="flex flex-col gap-3">
          {outline.chapters.map((ch, ci) => {
            const isClosed = closed[ch.id] ?? (ci > 1 && !outline.access)
            const chapterSeconds = ch.lessons.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0)
            const lessons = ch.lessons.map(l => ({ ...l, no: ++no }))
            return (
              <div key={ch.id} className="overflow-hidden rounded-card border border-line bg-white">
                <button type="button" onClick={() => setClosed(s => ({ ...s, [ch.id]: !isClosed }))}
                  className="flex w-full items-center justify-between gap-3 bg-bg px-4 py-3 text-left">
                  <div className="min-w-0">
                    <div className="font-extrabold text-ink">Chương {ci + 1}: {ch.title}</div>
                    <div className="text-xs text-muted">{ch.lessons.length} bài{chapterSeconds ? ` · ${clock(chapterSeconds)}` : ''}</div>
                  </div>
                  <ChevronDownIcon className={`size-5 shrink-0 text-muted transition-transform ${isClosed ? '' : 'rotate-180'}`} />
                </button>
                {!isClosed && (
                  <ul className="m-0 list-none p-0">
                    {ch.description && <li className="px-4 pt-3 text-sm text-muted">{ch.description}</li>}
                    {lessons.map(l => {
                      const open = !l.locked && l.playable
                      return (
                        <li key={l.id} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
                          <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${l.completed ? 'bg-green text-white' : 'bg-bg text-muted'}`}>
                            {l.completed ? <CheckIcon className="size-4" /> : l.no}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-ink">{l.title}</div>
                            <div className="text-xs text-muted">
                              {l.type === 'text' ? 'Bài đọc' : 'Video'}{l.durationSeconds ? ` · ${clock(l.durationSeconds)}` : ''}
                              {!l.playable ? ' · sắp có' : ''}
                            </div>
                          </div>
                          {open ? (
                            <Link href={learnHref(itemId, l.id, outline.learnerId)}
                              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold no-underline ${l.free && !outline.access ? 'border border-green bg-green-soft text-green-dark' : 'bg-green text-white'}`}>
                              {l.free && !outline.access ? 'Học thử' : 'Học'}
                            </Link>
                          ) : l.locked ? (
                            <LockIcon className="size-4 shrink-0 text-subtle" aria-label="Cần đăng ký khóa học" />
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
