'use client'

import { useRef, useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'

const SCROLL_STEP_PX = 240
const EDGE_TOLERANCE_PX = 8
const ARROW_CLASS = 'absolute top-[35%] z-[2] grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-line bg-white p-0 text-ink shadow-raised'

export default function ScrollRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = () => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > EDGE_TOLERANCE_PX)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - EDGE_TOLERANCE_PX)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  const scroll = (direction: 1 | -1) => {
    ref.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {canLeft && (
        <button type="button" aria-label="Cuộn sang trái" onClick={() => scroll(-1)} className={`${ARROW_CLASS} -left-4`}>
          <ChevronLeftIcon className="size-5" />
        </button>
      )}
      <div ref={ref} className={`pdp-scroll-row ${className ?? ''}`}>
        {children}
      </div>
      {canRight && (
        <button type="button" aria-label="Cuộn sang phải" onClick={() => scroll(1)} className={`${ARROW_CLASS} -right-4`}>
          <ChevronRightIcon className="size-5" />
        </button>
      )}
    </div>
  )
}
