import { useCallback, useEffect, useRef, useState } from 'react'

const EDGE_THRESHOLD = 8
const STEP_RATIO = 0.6

export interface ScrollEdges {
  canLeft: boolean
  canRight: boolean
}

export function scrollEdges(scrollLeft: number, clientWidth: number, scrollWidth: number): ScrollEdges {
  return {
    canLeft: scrollLeft > EDGE_THRESHOLD,
    canRight: scrollLeft + clientWidth < scrollWidth - EDGE_THRESHOLD,
  }
}

export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [edges, setEdges] = useState<ScrollEdges>({ canLeft: false, canRight: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    const next = scrollEdges(el.scrollLeft, el.clientWidth, el.scrollWidth)
    setEdges(prev => (prev.canLeft === next.canLeft && prev.canRight === next.canRight ? prev : next))
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [update])

  const scrollByStep = useCallback((direction: 1 | -1) => {
    const el = ref.current
    el?.scrollBy({ left: direction * el.clientWidth * STEP_RATIO, behavior: 'smooth' })
  }, [])

  return { ref, edges, scrollByStep }
}
