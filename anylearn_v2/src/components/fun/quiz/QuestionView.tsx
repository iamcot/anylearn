'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { answerQuiz, playLifeline, type ItemKey, type QuizQuestion, type QuizResult } from '@/lib/api/quiz'
import { DURING_ITEMS, ITEM_HINT, clockOffset, remainingMs, secondsLeft } from '@/lib/quiz/rules'
import ItemIcon from './ItemIcon'

const LETTERS = ['A', 'B', 'C', 'D']
const LABEL: Record<string, string> = { fifty: '50:50', community: 'Hỏi cộng đồng', time: '+15 giây', swap: 'Đổi câu' }

/** One question: server clock timer, four options, the four in-question helpers. Leaving the page counts as a wrong answer. */
export default function QuestionView({ token, initial, initialOffset, total, onDone }: {
  token: string
  initial: QuizQuestion
  initialOffset: number
  total: number
  onDone: (result: QuizResult) => void
}) {
  const [q, setQ] = useState(initial)
  const [offset, setOffset] = useState(initialOffset)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const sent = useRef(false)
  const away = useRef(false)

  const submit = useCallback(async (option: number | null) => {
    if (sent.current) return
    sent.current = true
    setBusy(true)
    const { data, error: err } = await answerQuiz(token, q.attemptId, option, away.current)
    if (err || !data) {
      sent.current = false
      setBusy(false)
      return setError(err ?? 'Không gửi được câu trả lời')
    }
    onDone(data)
  }, [token, q.attemptId, onDone])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onHide = () => { if (document.hidden) away.current = true }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  const left = remainingMs(q.expiresAt, offset, now)
  useEffect(() => {
    if (left <= 0) submit(null)
  }, [left, submit])

  const helper = async (item: ItemKey) => {
    setBusy(true)
    setError('')
    const { data, error: err } = await playLifeline(token, q.attemptId, item)
    setBusy(false)
    if (err || !data) return setError(err ?? 'Không dùng được')
    setOffset(clockOffset(data.serverNow))
    setQ(data)
  }

  const percent = Math.min((left / (total * 1000)) * 100, 100)
  const urgent = left < 6000
  return (
    <div className="grid gap-4">
      <div>
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="rounded-full bg-green-soft px-2.5 py-1 text-green-dark">{q.topicLabel}</span>
          <span className={urgent ? 'text-red-600' : 'text-ink'} aria-live="off">{secondsLeft(left)} giây</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/10" role="timer" aria-label="Thời gian còn lại">
          <div className={`h-full rounded-full transition-[width] duration-200 ease-linear ${urgent ? 'bg-red-500' : 'bg-green'}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <h1 className="m-0 rounded-2xl border border-line bg-white p-4 text-lg font-extrabold leading-snug lg:text-xl">{q.body}</h1>

      <div className="grid gap-2.5">
        {q.options.map((text, i) => {
          const hidden = q.hidden.includes(i)
          const share = q.community?.[i]
          return (
            <button key={i} type="button" disabled={hidden || busy} onClick={() => submit(i)}
              className={`relative flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-2xl border-2 border-line bg-white px-3 py-2 text-left font-bold text-ink ${hidden ? 'opacity-30' : 'cursor-pointer active:border-green'}`}>
              {share !== undefined && <span className="absolute inset-y-0 left-0 bg-sky-100" style={{ width: `${share}%` }} aria-hidden />}
              <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-green-soft text-sm font-black text-green-dark">{LETTERS[i]}</span>
              <span className={`relative flex-1 ${hidden ? 'line-through' : ''}`}>{text}</span>
              {share !== undefined && <span className="relative text-sm font-black text-sky-800">{share}%</span>}
            </button>
          )
        })}
      </div>
      {q.community && <p className="m-0 text-xs text-muted">Gợi ý từ cộng đồng, chỉ để tham khảo.</p>}
      {error && <p className="m-0 text-sm text-warn-text" role="alert">{error}</p>}

      <div className="grid grid-cols-4 gap-2">
        {DURING_ITEMS.map(key => {
          const qty = q.items[key] ?? 0
          const used = q.used.includes(key)
          return (
            <button key={key} type="button" disabled={busy || used || qty < 1} onClick={() => helper(key)} title={ITEM_HINT[key]}
              className={`relative flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-white px-1 py-2 text-center text-[11px] font-bold leading-tight ${used || qty < 1 ? 'opacity-40' : 'cursor-pointer'}`}>
              <ItemIcon item={key} className="size-7" />
              <span>{LABEL[key]}</span>
              <span className={`absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-black text-white ${qty > 0 ? 'bg-green' : 'bg-slate-400'}`}>{qty}</span>
            </button>
          )
        })}
      </div>
      <p className="m-0 text-center text-xs text-muted">Thoát giữa chừng sẽ tính là sai.</p>
    </div>
  )
}
