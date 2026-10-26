'use client'

import { useState } from 'react'
import { deleteReviewReply, replyToReview } from '@/lib/api'

interface Props {
  itemId: number
  reviewId: number
  token: string
  initialText?: string
  onDone: () => void
  onCancel: () => void
}

// The partner of the course answers a review right where it is shown (no back office needed).
export default function ReplyBox({ itemId, reviewId, token, initialText = '', onDone, onCancel }: Props) {
  const [text, setText] = useState(initialText)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    setBusy(true)
    setError('')
    const problem = await replyToReview(itemId, reviewId, text, token)
    setBusy(false)
    if (problem) { setError(problem); return }
    onDone()
  }

  const remove = async () => {
    setBusy(true)
    const problem = await deleteReviewReply(itemId, reviewId, token)
    setBusy(false)
    if (problem) { setError(problem); return }
    onDone()
  }

  return (
    <div className="mt-2 rounded-xl border border-line bg-white p-3">
      <textarea
        value={text}
        onChange={event => setText(event.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Cảm ơn phụ huynh đã chia sẻ..."
        aria-label="Nội dung trả lời"
        className="w-full resize-y rounded-lg border border-line px-3 py-2 font-[inherit] text-sm outline-none focus:border-green"
      />
      {error && <p className="m-0 mt-1 text-xs text-red">{error}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={send} disabled={busy || !text.trim()} className="btn btn--green px-4 py-2 text-sm">{busy ? 'Đang gửi...' : 'Gửi trả lời'}</button>
        <button type="button" onClick={onCancel} className="btn btn--outline px-4 py-2 text-sm">Hủy</button>
        {initialText && (
          <button type="button" onClick={remove} disabled={busy} className="ml-auto min-h-11 cursor-pointer border-0 bg-transparent text-xs text-red">Xóa trả lời</button>
        )}
      </div>
    </div>
  )
}
