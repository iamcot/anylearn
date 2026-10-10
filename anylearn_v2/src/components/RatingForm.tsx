'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/v2/api'

interface Props {
  itemId: number
  existingRating?: number
  existingComment?: string
  onSaved?: (myRating: { value: number; comment: string }) => void
}

export default function RatingForm({ itemId, existingRating, existingComment, onSaved }: Props) {
  const { user } = useAuth()
  const [rating, setRating] = useState(existingRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existingComment ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!user) return null

  async function submit() {
    if (rating === 0) { setError('Vui lòng chọn số sao'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`${API}/item/${itemId}/save-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user!.jwtToken}` },
        body: JSON.stringify({ rating, comment }),
      })
      const json = await res.json()
      if (json.resultCode === 1) {
        onSaved?.({ value: rating, comment })
      } else {
        setError(json.message ?? 'Có lỗi xảy ra')
      }
    } catch {
      setError('Có lỗi xảy ra, thử lại sau')
    } finally {
      setSaving(false)
    }
  }

  const display = hovered || rating

  return (
    <div className="rounded-[18px] border border-line bg-white p-5">
      <div className="font-black text-ink mb-3">
        {existingRating ? 'Cập nhật đánh giá của bạn' : 'Viết đánh giá'}
      </div>

      {/* Stars */}
      <div className="flex gap-1 mb-4" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className="text-[28px] leading-none transition-transform hover:scale-110"
            style={{ color: n <= display ? '#f5a623' : '#ddd', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={() => setHovered(n)}
            onClick={() => setRating(n)}
          >★</button>
        ))}
        {display > 0 && (
          <span className="ml-2 text-sm text-muted self-center">
            {['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Xuất sắc'][display]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn với khóa học này..."
        rows={3}
        style={{
          width: '100%', borderRadius: 10, border: '1.5px solid var(--color-line)',
          padding: '10px 12px', fontSize: 14, resize: 'vertical',
          fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
        }}
      />

      {error && <p className="text-[#e73348] text-xs mt-1 mb-0">{error}</p>}

      <button
        onClick={submit}
        disabled={saving}
        className="btn btn--green mt-3"
        style={{ opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Đang gửi...' : existingRating ? 'Cập nhật' : 'Gửi đánh giá'}
      </button>
    </div>
  )
}
