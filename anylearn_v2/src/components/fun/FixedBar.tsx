'use client'

import { useEffect, useRef } from 'react'

/**
 * Actions that stay in view at the bottom of a Vui học page, just above the bottom tabs.
 * `position: fixed` on purpose: `sticky` does not hold on iPhone Safari under the page's `overflow-x: hidden`.
 * The page needs bottom padding (pb-28) so the last content is not hidden behind it.
 */
export default function FixedBar({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  // toasts read this height and show above the bar instead of on top of it
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const publish = () => document.documentElement.style.setProperty('--fixed-bar-h', `${el.offsetHeight + 8}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--fixed-bar-h')
    }
  }, [])

  return (
    <div ref={ref} className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--app-tabs-h,0px)+var(--compare-bar-h,0px)+0.5rem)] z-30 lg:bottom-4">
      <div className="pointer-events-auto mx-auto max-w-[720px] px-4 lg:px-0">{children}</div>
    </div>
  )
}
