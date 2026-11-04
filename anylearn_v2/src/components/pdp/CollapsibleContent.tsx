'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDownIcon } from '@/components/icons'

const COLLAPSED_PX = 560

// Long course descriptions start folded with a fade and "Xem thêm"; the full text is still in the server HTML
// (only hidden by max-height), so search engines read all of it. A short text shows no button.
export default function CollapsibleContent({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [long, setLong] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setLong(el.scrollHeight > COLLAPSED_PX + 80)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const folded = long && !open
  return (
    <div>
      <div ref={ref} className="relative overflow-hidden" style={folded ? { maxHeight: COLLAPSED_PX } : undefined}>
        {children}
        {folded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />}
      </div>
      {long && (
        <button type="button" onClick={() => {
          if (open) ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
          setOpen(!open)
        }}
          className="mt-3 flex items-center gap-1 text-sm font-bold text-green-dark">
          {open ? 'Thu gọn' : 'Xem thêm'}
          <ChevronDownIcon className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}
