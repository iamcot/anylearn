'use client'

import { useState, useEffect } from 'react'
import type { PdpReview } from '@/lib/api'

interface Props {
  reviews: PdpReview[]
  rating?: number
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value)
  return (
    <span style={{ fontSize: size, color: '#f5a623', letterSpacing: 1 }}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  )
}

function ReviewRow({ r }: { r: PdpReview }) {
  return (
    <div className="flex gap-3 py-3 first:pt-0">
      {r.user_image
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={r.user_image} alt={r.user_name}
            className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />
        : <div className="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#eef7ff,#e9fff3)] grid place-items-center text-base shrink-0 mt-0.5">👤</div>
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-bold text-ink text-[13px]">{r.user_name}</span>
          <Stars value={Number(r.value)} size={12} />
        </div>
        {r.extra_value && (
          <p className="m-0 text-text text-sm leading-[1.6]">{r.extra_value}</p>
        )}
      </div>
    </div>
  )
}

export default function ReviewsList({ reviews, rating }: Props) {
  const [open, setOpen] = useState(false)

  const sorted = [...reviews].sort((a, b) => Number(b.value) - Number(a.value))
  const top3 = sorted.slice(0, 3)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div className="divide-y divide-[var(--color-line,#e8ecf0)]">
        {top3.map((r, i) => <ReviewRow key={i} r={r} />)}
      </div>

      {reviews.length > 3 && (
        <div className="mt-4">
          <button className="btn btn--outline text-sm" onClick={() => setOpen(true)}>
            Xem thêm {reviews.length - 3} đánh giá
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[1100] flex items-end md:items-center justify-center"
          style={{ background: 'rgba(15,23,42,0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full md:max-w-lg max-h-[85vh] rounded-t-[24px] md:rounded-[20px] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[var(--color-line,#e8ecf0)] shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-ink text-base">Đánh giá từ học viên</span>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9aa5b1', lineHeight: 1 }}
                >×</button>
              </div>
              {rating != null && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-ink">{rating.toFixed(1)}</span>
                  <Stars value={rating} size={18} />
                  <span className="text-sm text-muted">({reviews.length} đánh giá)</span>
                </div>
              )}
            </div>
            <div className="overflow-y-auto px-5 divide-y divide-[var(--color-line,#e8ecf0)]">
              {reviews.map((r, i) => <ReviewRow key={i} r={r} />)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
