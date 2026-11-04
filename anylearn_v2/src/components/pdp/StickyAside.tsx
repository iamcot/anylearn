'use client'

import { useEffect, useRef, type ReactNode } from 'react'

const TOP_GAP = 80 // under the site header (lg:top-20)
// Room for the floating "Giá mua · Đăng ký ngay" bar (RegisterButton) and the compare bar under it.
const BOTTOM_GAP = 96

// Sticky column that also works when it is taller than the screen: a short card sticks under the header,
// a tall one scrolls with the page until its bottom shows, then sticks there, so every button stays reachable.
// The sticky top is applied only on desktop (lg); on a phone the card stays in the page flow.
export default function StickyAside({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  // `overflow-x: hidden` on body (globals.css) makes body a scroll container and sticky stops working;
  // `clip` looks the same without that (same fix as the learning page).
  useEffect(() => {
    document.body.style.overflowX = 'clip'
    return () => { document.body.style.overflowX = '' }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const compareBar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--compare-bar-h')) || 0
      const top = Math.min(TOP_GAP, window.innerHeight - el.offsetHeight - BOTTOM_GAP - compareBar)
      el.style.setProperty('--aside-top', `${top}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => { ro.disconnect(); window.removeEventListener('resize', update) }
  }, [])

  return (
    <div ref={ref} className={`lg:sticky lg:top-[var(--aside-top,80px)] ${className}`}>
      {children}
    </div>
  )
}
