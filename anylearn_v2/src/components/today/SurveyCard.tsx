'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSurveys, sendFeedback, type PendingSurvey } from '@/lib/today/api'

const SCORES = [1, 2, 3, 4, 5]
const LOW_SCORE = 2

function SurveyRow({ survey, token, onDone }: { survey: PendingSurvey; token: string; onDone: () => void }) {
  const [score, setScore] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [thanks, setThanks] = useState(false)

  async function submit() {
    setBusy(true)
    setError('')
    const { data, error: err } = await sendFeedback(survey.enrollmentId, score, note, token)
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không gửi được, bạn thử lại nhé')
    setThanks(true)
    setTimeout(onDone, 2500)
  }

  if (thanks) {
    return <p className="text-sm font-bold text-green-dark">Cảm ơn bạn! anyLEARN đã ghi nhận.</p>
  }
  return (
    <div>
      <h3 className="text-base font-black text-ink">{survey.learnerName} học {survey.itemTitle} có vui không?</h3>
      <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Chấm điểm">
        {SCORES.map(value => (
          <button
            key={value} type="button" role="radio" aria-checked={score === value} aria-label={`${value} sao`}
            onClick={() => setScore(value)}
            className={`flex size-11 items-center justify-center rounded-full border text-lg font-black ${score >= value ? 'border-warn-line bg-warn-soft text-warn-text' : 'border-line bg-white text-muted'}`}
          >
            ★
          </button>
        ))}
      </div>
      {score > 0 && score <= LOW_SCORE && (
        <textarea
          value={note} onChange={event => setNote(event.target.value)} rows={2} maxLength={500}
          placeholder="Bé chưa vui ở điểm nào? (không bắt buộc)"
          className="mt-3 w-full rounded-xl border border-line p-3 text-sm"
        />
      )}
      {error && <p className="mt-2 text-sm text-warn-text">{error}</p>}
      {score > 0 && (
        <button
          type="button" onClick={submit} disabled={busy}
          className="mt-3 inline-flex min-h-11 items-center rounded-full bg-green px-5 text-[15px] font-black text-white hover:bg-green-dark disabled:opacity-60"
        >
          Gửi
        </button>
      )}
    </div>
  )
}

/** Mid-course survey of the selected learner (plan 07.4): one question, shown until answered. */
export default function SurveyCard({ learnerId, token }: { learnerId: number; token: string }) {
  const [surveys, setSurveys] = useState<PendingSurvey[]>([])
  const wanted = Number(useSearchParams().get('survey')) || null
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    let cancelled = false
    getSurveys(token).then(({ data }) => { if (!cancelled && data) setSurveys(data) })
    return () => { cancelled = true }
  }, [token])

  const mine = surveys.filter(survey => survey.learnerId === learnerId)
  const highlighted = wanted != null && mine.some(survey => survey.enrollmentId === wanted)

  // A notification link (?survey=ID) brings the person straight to the question.
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlighted])

  if (mine.length === 0) return null
  return (
    <section ref={ref} className={`space-y-4 rounded-[20px] border bg-white p-4 ${highlighted ? 'border-green ring-2 ring-green/30' : 'border-line'}`}>
      <span className="text-xs font-bold uppercase tracking-wide text-muted">Giữa khóa</span>
      {mine.map(survey => (
        <SurveyRow
          key={survey.enrollmentId} survey={survey} token={token}
          onDone={() => setSurveys(list => list.filter(item => item.enrollmentId !== survey.enrollmentId))}
        />
      ))}
    </section>
  )
}
