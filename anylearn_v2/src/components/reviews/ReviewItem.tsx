'use client'

import { useState } from 'react'
import type { PdpReview } from '@/lib/api'
import { REVIEW_CRITERIA, VERIFIED_LABEL } from '@/config/reviews'
import { formatDate } from '@/lib/format/date'
import StarRating from '@/components/StarRating'
import { ShieldCheckIcon, UserIcon } from '@/components/icons'
import ReplyBox from './ReplyBox'

interface Props {
  review: PdpReview
  itemId: number
  partnerName?: string
  // Set when the signed-in person owns the course: they can answer
  replyToken?: string
  onChanged?: () => void
  // Partner page: the course the review is about
  showCourse?: boolean
}

export default function ReviewItem({ review, itemId, partnerName = 'Đối tác', replyToken, onChanged, showCourse }: Props) {
  const [replying, setReplying] = useState(false)
  const scores = REVIEW_CRITERIA.filter(criterion => review.scores?.[criterion.id] !== undefined)
  const canReply = Boolean(replyToken && review.id)

  return (
    <div className="flex gap-3 py-4 first:pt-0">
      {review.user_image
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={review.user_image} alt="" className="mt-0.5 size-9 shrink-0 rounded-full object-cover" />
        : <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-soft to-green-soft text-blue"><UserIcon className="size-5" /></div>}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-bold text-ink">{review.user_name}</span>
          <StarRating value={Number(review.value)} className="size-3" />
          <span className="text-xs text-subtle">{formatDate(review.created_at)}</span>
        </div>
        {review.is_verified && (
          <div className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-green-dark"><ShieldCheckIcon className="size-3.5" />{VERIFIED_LABEL}</div>
        )}
        {showCourse && review.item_title && review.item_id && (
          <div className="mb-1 text-xs text-muted">Khóa: {review.item_title}</div>
        )}
        {scores.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {scores.map(criterion => (
              <span key={criterion.id} className="rounded-full bg-bg px-2 py-0.5 text-[11px] text-muted">{criterion.label} {review.scores?.[criterion.id]}/5</span>
            ))}
          </div>
        )}
        {review.extra_value && <p className="m-0 text-sm leading-[1.6] text-text">{review.extra_value}</p>}
        {review.media && review.media.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {review.media.map(url => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="size-20 overflow-hidden rounded-xl bg-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Ảnh từ phụ huynh" loading="lazy" className="size-full object-cover" />
              </a>
            ))}
          </div>
        )}

        {review.partner_reply && !replying && (
          <div className="mt-2.5 rounded-xl bg-bg px-3.5 py-2.5">
            <div className="mb-0.5 text-xs font-medium text-ink">Phản hồi từ {partnerName}</div>
            <p className="m-0 whitespace-pre-line text-sm leading-[1.6] text-text">{review.partner_reply}</p>
          </div>
        )}

        {canReply && !replying && (
          <button type="button" onClick={() => setReplying(true)} className="mt-1.5 min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-green-dark">
            {review.partner_reply ? 'Sửa trả lời' : 'Trả lời'}
          </button>
        )}
        {canReply && replying && replyToken && review.id && (
          <ReplyBox
            itemId={itemId}
            reviewId={review.id}
            token={replyToken}
            initialText={review.partner_reply ?? ''}
            onCancel={() => setReplying(false)}
            onDone={() => { setReplying(false); onChanged?.() }}
          />
        )}
      </div>
    </div>
  )
}
