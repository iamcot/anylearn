'use client'

import { useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { saveReview, uploadReviewPhoto } from '@/lib/api'
import { REVIEW_CRITERIA, REVIEW_MAX_PHOTOS, REVIEW_QUICK_PHRASES, STAR_LABELS } from '@/config/reviews'
import { appendPhrase } from '@/lib/reviews/text'
import { GUEST_CHIP_OFF } from '@/components/guest/chipStyles'
import { CameraIcon, CloseIcon, StarIcon } from './icons'
import type { MyRating } from './useItemRatingStatus'

interface Props {
  itemId: number
  existingRating?: number
  existingComment?: string
  existingScores?: Record<string, number>
  existingMedia?: string[]
  onSaved?: (myRating: MyRating) => void
}

function Stars({ value, onPick, size = 'size-7', box = 'size-11' }: { value: number; onPick: (n: number) => void; size?: string; box?: string }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          aria-label={`${n} sao`}
          className={`grid ${box} cursor-pointer place-items-center border-0 bg-transparent p-0 transition-transform hover:scale-110 ${n <= display ? 'text-star' : 'text-line'}`}
          onMouseEnter={() => setHovered(n)}
          onClick={() => onPick(n === value ? 0 : n)}
        >
          <StarIcon filled className={size} />
        </button>
      ))}
    </div>
  )
}

// Writing or editing a review: stars, optional scores per criterion, a comment with quick phrases and up to 4 photos.
export default function RatingForm({ itemId, existingRating, existingComment, existingScores, existingMedia, onSaved }: Props) {
  const { user } = useAuth()
  const [rating, setRating] = useState(existingRating ?? 0)
  const [comment, setComment] = useState(existingComment ?? '')
  const [scores, setScores] = useState<Record<string, number>>(existingScores ?? {})
  const [media, setMedia] = useState<string[]>(existingMedia ?? [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  if (!user) return null
  const token = user.jwtToken

  async function submit() {
    if (rating === 0) { setError('Vui lòng chọn số sao'); return }
    setSaving(true)
    setError('')
    const problem = await saveReview(itemId, { rating, comment, scores, media }, token)
    setSaving(false)
    if (problem) { setError(problem); return }
    onSaved?.({ value: rating, comment, scores, media })
  }

  async function addPhotos(files: FileList | null) {
    if (!files) return
    setUploading(true)
    setError('')
    for (const file of Array.from(files).slice(0, REVIEW_MAX_PHOTOS - media.length)) {
      const result = await uploadReviewPhoto(itemId, file, token)
      if (result.url) setMedia(current => (current.length < REVIEW_MAX_PHOTOS ? [...current, result.url as string] : current))
      else setError(result.error ?? 'Không tải được ảnh')
    }
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <div className="rounded-[18px] border border-line bg-white p-5">
      <div className="mb-1 font-extrabold text-ink">{existingRating ? 'Cập nhật đánh giá của bạn' : 'Viết đánh giá'}</div>
      <p className="m-0 mb-3 text-xs text-muted">Chỉ phụ huynh đã đăng ký khóa này mới đánh giá được, nên mỗi đánh giá đều có dấu &quot;Đã học tại anyLEARN&quot;.</p>

      <div className="mb-4 flex items-center">
        <Stars value={rating} onPick={setRating} />
        {rating > 0 && <span className="ml-2 self-center text-sm text-muted">{STAR_LABELS[rating]}</span>}
      </div>

      <div className="mb-4 grid gap-1 sm:grid-cols-2 sm:gap-x-6">
        {REVIEW_CRITERIA.map(criterion => (
          <div key={criterion.id} className="flex items-center justify-between gap-2">
            <span className="text-sm text-text">{criterion.label}</span>
            <Stars value={scores[criterion.id] ?? 0} size="size-5" box="size-9" onPick={n => setScores(current => {
              const next = { ...current }
              if (n === 0) delete next[criterion.id]
              else next[criterion.id] = n
              return next
            })} />
          </div>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        {REVIEW_QUICK_PHRASES.map(phrase => (
          <button key={phrase} type="button" onClick={() => setComment(current => appendPhrase(current, phrase))} className={`${GUEST_CHIP_OFF} min-h-9 px-3 text-[13px]`}>{phrase}</button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Chia sẻ trải nghiệm của bạn với khóa học này..."
        rows={3}
        maxLength={2000}
        className="w-full resize-y rounded-xl border border-line px-3 py-2.5 font-[inherit] text-sm outline-none focus:border-green"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {media.map(url => (
          <div key={url} className="relative size-16 overflow-hidden rounded-xl bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Ảnh đã chọn" className="size-full object-cover" />
            <button type="button" aria-label="Bỏ ảnh" onClick={() => setMedia(current => current.filter(item => item !== url))} className="absolute right-0.5 top-0.5 grid size-6 cursor-pointer place-items-center rounded-full border-0 bg-ink/60 p-0 text-white">
              <CloseIcon className="size-3.5" />
            </button>
          </div>
        ))}
        {media.length < REVIEW_MAX_PHOTOS && (
          <>
            <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="btn btn--outline min-h-11 gap-1.5 px-3 py-2 text-sm">
              <CameraIcon className="size-4" />
              {uploading ? 'Đang tải ảnh...' : 'Thêm ảnh'}
            </button>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={event => addPhotos(event.target.files)} />
          </>
        )}
      </div>

      {error && <p className="mb-0 mt-2 text-xs text-red">{error}</p>}

      <button onClick={submit} disabled={saving || uploading} className={`btn btn--green mt-3 ${saving ? 'opacity-70' : ''}`}>
        {saving ? 'Đang gửi...' : existingRating ? 'Cập nhật' : 'Gửi đánh giá'}
      </button>
    </div>
  )
}
