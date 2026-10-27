'use client'

import { useEffect, useState } from 'react'
import { MESSAGE_INTERVAL_MS, PROGRESS_ICONS, PROGRESS_MESSAGES } from '@/config/aiSuggest'
import { loadingProgress, messageAt } from '@/lib/aisuggest/progress'

const SPARKLES = [
  { left: '12%', top: '18%', delay: '0s' }, { left: '82%', top: '10%', delay: '0.4s' },
  { left: '90%', top: '58%', delay: '0.9s' }, { left: '6%', top: '64%', delay: '1.2s' },
]

/** Shown while the suggestions are made: an animated icon, a bar that fills, and cheerful lines that keep changing. */
export default function AiLoadingStage({ name, done }: { name: string; done: boolean }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const started = Date.now()
    const timer = setInterval(() => setElapsed(Date.now() - started), 200)
    return () => clearInterval(timer)
  }, [])

  const percent = done ? 100 : loadingProgress(elapsed)
  const step = Math.floor(elapsed / MESSAGE_INTERVAL_MS)
  const icon = PROGRESS_ICONS[step % PROGRESS_ICONS.length]

  return (
    <div className="relative mx-auto flex min-h-[60vh] max-w-[520px] flex-col items-center justify-center px-6 text-center" role="status" aria-live="polite">
      {SPARKLES.map((sparkle, index) => (
        <span key={index} aria-hidden className="ai-twinkle pointer-events-none absolute text-2xl" style={{ left: sparkle.left, top: sparkle.top, animationDelay: sparkle.delay }}>✨</span>
      ))}
      <div aria-hidden className="ai-float text-7xl">{icon}</div>
      <p className="mt-6 min-h-14 text-lg font-black text-ink">{messageAt(PROGRESS_MESSAGES, step, name)}</p>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-green-soft" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
        <div className="h-full rounded-full bg-gradient-to-r from-blue to-green transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">{Math.round(percent)}%</p>
    </div>
  )
}
