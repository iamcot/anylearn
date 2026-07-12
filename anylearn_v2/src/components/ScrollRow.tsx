'use client'

import { useRef, useEffect, useState } from 'react'

export default function ScrollRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = () => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  return (
    <div style={{ position: 'relative' }}>
      {canLeft && (
        <button onClick={() => scroll(-1)} style={{
          position: 'absolute', left: -16, top: '35%', transform: 'translateY(-50%)',
          zIndex: 2, width: 36, height: 36, borderRadius: '50%',
          background: 'white', border: '1px solid #e6edf4',
          boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
          cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16,
        }}>‹</button>
      )}
      <div ref={ref} className={`pdp-scroll-row ${className ?? ''}`}>
        {children}
      </div>
      {canRight && (
        <button onClick={() => scroll(1)} style={{
          position: 'absolute', right: -16, top: '35%', transform: 'translateY(-50%)',
          zIndex: 2, width: 36, height: 36, borderRadius: '50%',
          background: 'white', border: '1px solid #e6edf4',
          boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
          cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16,
        }}>›</button>
      )}
    </div>
  )
}
