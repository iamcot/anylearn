'use client'

import { useEffect, useState } from 'react'
import { addLessonNote, deleteLessonNote, getLessonNotes, type LessonNote } from '@/lib/api/learn'
import { noteTime } from '@/lib/learn/rules'
import type { PlayerControl } from './LessonPlayer'

const MAX_LENGTH = 500

interface Props {
  token: string
  lessonId: number
  learnerId: number | null
  /** A video lesson: notes carry the second of the video and a tap on it jumps there. */
  timed: boolean
  control: React.MutableRefObject<PlayerControl | null>
  onJump?: () => void
}

/** The learner's notes on one lesson (plan 17): written at the second being watched, a tap on the time jumps back there. */
export default function LessonNotes({ token, lessonId, learnerId, timed, control, onJump }: Props) {
  const [notes, setNotes] = useState<LessonNote[]>([])
  const [draft, setDraft] = useState('')
  const [at, setAt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getLessonNotes(token, lessonId, learnerId).then(res => { if (!cancelled) setNotes(res.data ?? []) })
    return () => { cancelled = true }
  }, [token, lessonId, learnerId])

  const save = async () => {
    if (!draft.trim()) return
    setBusy(true)
    setError(null)
    const res = await addLessonNote(token, lessonId, { learnerId, positionSeconds: timed ? at : 0, body: draft })
    setBusy(false)
    if (res.error || !res.data) return setError(res.error ?? 'Không lưu được ghi chú')
    setNotes(res.data.notes)
    setDraft('')
  }

  const remove = async (note: LessonNote) => {
    setNotes(list => list.filter(n => n.id !== note.id))
    await deleteLessonNote(token, note.id, learnerId)
  }

  return (
    <section className="mt-5">
      <h2 className="mb-2 mt-0 text-sm font-extrabold text-ink">Ghi chú của tôi</h2>
      <div className="rounded-card border border-line bg-white p-3">
        <label htmlFor="lesson-note" className="sr-only">Ghi chú</label>
        <textarea id="lesson-note" rows={2} maxLength={MAX_LENGTH} value={draft} placeholder={timed ? 'Viết ghi chú tại thời điểm đang xem…' : 'Viết ghi chú cho bài này…'}
          onFocus={() => setAt(control.current?.time() ?? 0)} onChange={e => setDraft(e.target.value)}
          className="w-full resize-none rounded-lg border border-line bg-white p-2 text-sm text-ink" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">{timed ? `Tại ${noteTime(at)}` : ''}</span>
          <button type="button" disabled={busy || !draft.trim()} onClick={save} className="btn btn--green min-h-9 px-4 py-1.5 text-sm disabled:opacity-50">Lưu ghi chú</button>
        </div>
        {error && <p className="m-0 mt-2 text-xs text-red">{error}</p>}
      </div>
      {notes.length > 0 && (
        <ul className="m-0 mt-3 list-none p-0">
          {notes.map(note => (
            <li key={note.id} className="flex items-start gap-3 border-t border-line py-2.5 text-sm">
              {timed ? (
                <button type="button" onClick={() => { control.current?.seekTo(note.positionSeconds); onJump?.() }}
                  className="shrink-0 rounded-full bg-green-soft px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-green-dark">{noteTime(note.positionSeconds)}</button>
              ) : null}
              <span className="min-w-0 flex-1 whitespace-pre-line break-words text-ink">{note.body}</span>
              <button type="button" aria-label="Xóa ghi chú" onClick={() => remove(note)} className="shrink-0 px-1 text-muted hover:text-red">×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
