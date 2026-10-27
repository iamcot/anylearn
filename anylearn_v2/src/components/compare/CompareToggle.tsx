'use client'

import { useState } from 'react'
import { toggleCompare, useCompareList } from '@/lib/compare/store'
import { MAX_COMPARE } from '@/lib/compare/selection'

interface Props {
  itemId: number
  title: string
  image?: string | null
  /** `card` sits on top of a course card, `inline` is a normal button (course page). */
  variant?: 'card' | 'inline'
}

/** "So sánh" on a course: the parent picks up to three courses by hand. */
export default function CompareToggle({ itemId, title, image, variant = 'card' }: Props) {
  const list = useCompareList()
  const [full, setFull] = useState(false)
  const picked = list.some(entry => entry.id === itemId)

  function onClick(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    const result = toggleCompare({ id: itemId, title, image })
    setFull(result.full)
    if (result.full) setTimeout(() => setFull(false), 2500)
  }

  const base = 'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border text-xs font-bold transition-colors'
  const tone = picked ? 'border-green bg-green text-white' : 'border-line bg-white text-ink hover:border-green'
  const place = variant === 'card' ? 'relative z-20 px-3' : 'px-4 text-sm'

  return (
    <span className={variant === 'card' ? 'relative z-20 inline-flex flex-col items-start' : 'inline-flex flex-col items-start'}>
      <button type="button" onClick={onClick} aria-pressed={picked} className={`${base} ${tone} ${place}`}>
        <span aria-hidden>{picked ? '✓' : '+'}</span> {picked ? 'Đã chọn để so sánh' : 'So sánh'}
      </button>
      {full && <span role="status" className="mt-1 text-xs text-red">Chỉ so sánh tối đa {MAX_COMPARE} khóa. Bỏ bớt một khóa để chọn khóa này.</span>}
    </span>
  )
}
