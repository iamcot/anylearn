'use client'

import { useState } from 'react'
import ReportPriceModal from './ReportPriceModal'

const TEXT_BUTTON = 'cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-xs font-medium text-green-dark underline'
const SECONDARY_BUTTON = 'btn btn--outline min-h-11 text-sm'

// "Thấy giá rẻ hơn ở nơi khác? Báo cho chúng tôi": a small text link on the course page, a button on /info/why-anylearn.
export default function ReportPriceButton({ itemId, variant = 'text' }: { itemId?: number; variant?: 'text' | 'button' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={variant === 'text' ? TEXT_BUTTON : SECONDARY_BUTTON}>
        Thấy giá rẻ hơn ở nơi khác? Báo cho chúng tôi
      </button>
      {open && <ReportPriceModal itemId={itemId} onClose={() => setOpen(false)} />}
    </>
  )
}
