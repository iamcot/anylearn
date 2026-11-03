'use client'

import { useState } from 'react'
import RatingForm from './RatingForm'
import StarRating from './StarRating'
import { StarIcon } from './icons'
import { useItemRatingStatus, type MyRating } from './useItemRatingStatus'

/** `className` sets the outer margin; while the form is open the block takes the full row. */
export default function OrderItemRating({ itemId, className = 'mt-2' }: { itemId: number; className?: string }) {
  const { checked, hasPurchased, myRating, saveRating } = useItemRatingStatus(itemId)
  const [open, setOpen] = useState(false)

  function handleSaved(saved: MyRating) {
    saveRating(saved)
    setOpen(false)
  }

  if (!checked || !hasPurchased) return null
  const box = `${className} ${open ? 'w-full' : ''}`

  if (!myRating) {
    return (
      <div className={box}>
        {open ? (
          <>
            <RatingForm itemId={itemId} onSaved={handleSaved} />
            <button onClick={() => setOpen(false)}
              className="mt-1 min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs text-subtle hover:text-ink">
              Hủy
            </button>
          </>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full border border-line bg-white px-3 text-xs font-medium text-ink hover:bg-bg">
            <StarIcon className="size-3.5" /> Đánh giá
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={box}>
      {open ? (
        <>
          <RatingForm
            itemId={itemId}
            existingRating={myRating?.value}
            existingComment={myRating?.comment}
            existingScores={myRating?.scores}
            existingMedia={myRating?.media}
            onSaved={handleSaved}
          />
          <button onClick={() => setOpen(false)}
            className="mt-1 min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs text-subtle hover:text-ink">
            Hủy
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <StarRating value={myRating?.value ?? 0} className="size-3.5" />
          <button
            onClick={() => setOpen(true)}
            className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-blue underline">
            Sửa
          </button>
        </div>
      )}
    </div>
  )
}
