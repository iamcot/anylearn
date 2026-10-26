'use client'

import { useState } from 'react'
import { reportReview } from '@/lib/api'

interface Props {
  itemId: number
  reviewId: number
  token: string
  onCancel: () => void
  onDone: () => void
}

// The partner tells the team why a review looks wrong; the team decides to keep or hide it (the partner cannot delete reviews).
export default function ReportBox({ itemId, reviewId, token, onCancel, onDone }: Props) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    setBusy(true)
    setError('')
    const problem = await reportReview(itemId, reviewId, reason, token)
    setBusy(false)
    if (problem) { setError(problem); return }
    onDone()
  }

  return (
    <div className="mt-2 rounded-xl border border-line bg-white p-3">
      <p className="m-0 mb-2 text-xs text-muted">anyLEARN sẽ xem xét và giữ hoặc ẩn đánh giá này. Bạn không cần xóa, và người viết không biết ai báo cáo.</p>
      <textarea
        value={reason}
        onChange={event => setReason(event.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Ví dụ: Người này chưa từng học ở trung tâm / nội dung nói về khóa khác"
        aria-label="Lý do báo cáo"
        className="w-full resize-y rounded-lg border border-line px-3 py-2 font-[inherit] text-sm outline-none focus:border-green"
      />
      {error && <p className="m-0 mt-1 text-xs text-red">{error}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={send} disabled={busy || !reason.trim()} className="btn btn--green px-4 py-2 text-sm">{busy ? 'Đang gửi...' : 'Gửi báo cáo'}</button>
        <button type="button" onClick={onCancel} className="btn btn--outline px-4 py-2 text-sm">Hủy</button>
      </div>
    </div>
  )
}
