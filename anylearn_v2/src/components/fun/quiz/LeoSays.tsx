'use client'

import { useEffect, useState } from 'react'
import BrandText from '../BrandText'
import { Leo } from '../Leo'
import { leoLines, type LeoContext } from '@/lib/fun/leo'

/** A small Leo with a speech box beside him for the quiz pages; the lines change every few seconds. Fits a 360 px phone. */
export default function LeoSays({ ctx }: { ctx: LeoContext }) {
  const lines = leoLines(ctx)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (lines.length < 2) return
    const id = setInterval(() => setTick(t => t + 1), 6000)
    return () => clearInterval(id)
  }, [lines.length])
  const text = lines[tick % lines.length]
  return (
    <div className="flex items-end gap-2" aria-live="polite">
      <Leo className="size-14 shrink-0" waving />
      <div key={text} className="leo-pop relative mb-2 min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 text-[13px] font-semibold leading-snug text-ink ring-1 ring-line">
        <BrandText text={text} />
        <span className="absolute -left-1.5 bottom-3 size-3 rotate-45 bg-white ring-1 ring-line [clip-path:polygon(0_100%,0_0,100%_100%)]" aria-hidden />
      </div>
    </div>
  )
}
