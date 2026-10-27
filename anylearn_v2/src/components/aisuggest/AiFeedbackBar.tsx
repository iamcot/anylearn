'use client'

import { useState } from 'react'
import { DOWN_OPTIONS, UP_OPTIONS } from '@/config/aiSuggest'
import { sendAiFeedback } from '@/lib/api/aiSuggest'
import { toggleChoice } from '@/lib/interests/choices'

interface Props {
  suggestionId: number
  token: string
  initialRating?: number
}

/** Thumbs up/down under the list with quick reasons; the answers are used to make the next suggestions better. */
export default function AiFeedbackBar({ suggestionId, token, initialRating }: Props) {
  const [rating, setRating] = useState<1 | -1 | 0>(initialRating === 1 ? 1 : initialRating === -1 ? -1 : 0)
  const [reasons, setReasons] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(initialRating === 1 || initialRating === -1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (rating === 0) return
    setBusy(true)
    setError('')
    const { error: problem } = await sendAiFeedback(suggestionId, { rating, reasons, comment }, token)
    setBusy(false)
    if (problem) return setError(problem)
    setSent(true)
    setOpen(false)
  }

  function pick(value: 1 | -1) {
    setRating(value)
    setReasons([])
    setOpen(true)
    setSent(false)
  }

  const options = rating === 1 ? UP_OPTIONS : DOWN_OPTIONS
  return (
    <section className="mx-auto mt-8 max-w-[640px] rounded-[20px] border border-line bg-white p-4 text-center">
      <p className="m-0 text-sm font-bold text-ink">Gợi ý hôm nay có hợp với bạn không?</p>
      <div className="mt-3 flex justify-center gap-3">
        {([1, -1] as const).map(value => (
          <button
            key={value} type="button" onClick={() => pick(value)} aria-pressed={rating === value}
            aria-label={value === 1 ? 'Hợp' : 'Chưa hợp'}
            className={`flex size-12 items-center justify-center rounded-full border text-2xl ${rating === value ? 'border-green bg-green-soft' : 'border-line bg-white hover:bg-bg'}`}
          >
            {value === 1 ? '👍' : '👎'}
          </button>
        ))}
      </div>
      {sent && !open && <p className="m-0 mt-3 text-sm font-bold text-green-dark">Cảm ơn bạn! Lần sau anyLEARN sẽ gợi ý tốt hơn.</p>}
      {open && rating !== 0 && (
        <div className="mt-4 text-left">
          <p className="m-0 mb-2 text-xs font-bold text-muted">{rating === 1 ? 'Điều gì làm bạn thích?' : 'Điều gì chưa ổn?'} (không bắt buộc)</p>
          <div className="flex flex-wrap gap-2">
            {options.map(option => (
              <button
                key={option.key} type="button" aria-pressed={reasons.includes(option.key)}
                onClick={() => setReasons(prev => toggleChoice(prev, option.key))}
                className={`min-h-11 rounded-full border px-3.5 text-sm ${reasons.includes(option.key) ? 'border-green bg-green-soft font-bold text-green-dark' : 'border-line bg-white text-text'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            value={comment} onChange={event => setComment(event.target.value)} maxLength={500} rows={2}
            placeholder="Góp ý thêm cho anyLEARN (không bắt buộc)"
            className="mt-3 w-full rounded-xl border border-line p-3 text-sm"
          />
          {error && <p className="m-0 mt-1 text-xs text-red">{error}</p>}
          <button type="button" onClick={send} disabled={busy} className="btn btn--green mt-3 w-full text-sm disabled:opacity-50">
            {busy ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      )}
    </section>
  )
}
