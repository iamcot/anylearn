'use client'

import { useState } from 'react'
import RatingForm from './RatingForm'
import StarRating from './StarRating'
import { StarIcon } from './icons'
import { useItemRatingStatus, type MyRating } from './useItemRatingStatus'

export default function OrderItemRating({ itemId }: { itemId: number }) {
  const { checked, hasPurchased, myRating, saveRating } = useItemRatingStatus(itemId)
  const [open, setOpen] = useState(false)

  function handleSaved(saved: MyRating) {
    saveRating(saved)
    setOpen(false)
  }

  if (!checked || !hasPurchased) return null

  if (!myRating) {
    return (
      <div className="mt-2">
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
            className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full border border-blue bg-white px-3 text-xs font-semibold text-blue hover:bg-blue-soft">
            <StarIcon className="size-3.5" /> Đánh giá
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2">
      {open ? (
        <>
          <RatingForm
            itemId={itemId}
            existingRating={myRating?.value}
            existingComment={myRating?.comment}
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
