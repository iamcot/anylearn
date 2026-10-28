import type { QuizResult } from '@/lib/api/quiz'

const MAX_SLOTS = 8
const SPARKS = 14

export function StarShape({ className, filled }: { className?: string; filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
        fill={filled ? '#fbbf24' : '#e2e8f0'}
        stroke={filled ? '#f59e0b' : '#cbd5e1'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Sparks flying out of a new star: fixed angles, so the burst looks the same every time. */
function Sparks() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * Math.PI * 2 + (i % 2) * 0.2
        const dist = 38 + (i % 3) * 12
        const star = i % 2 === 0
        return (
          <span
            key={i}
            className="quiz-spark absolute left-1/2 top-1/2"
            style={{ '--dx': `${Math.cos(angle) * dist}px`, '--dy': `${Math.sin(angle) * dist}px`, animationDelay: `${0.25 + (i % 4) * 0.04}s` } as React.CSSProperties}
          >
            {star ? <StarShape className="size-3" filled /> : <span className="block size-1.5 rounded-full bg-amber-300" />}
          </span>
        )
      })}
    </span>
  )
}

/** The row of stars on a right answer: the new star(s) pop up, bounce twice and throw sparks; the empty slots of the rank stay grey. */
export default function StarBurst({ result }: { result: QuizResult }) {
  const gained = Math.max(0, result.starsGained)
  const needed = result.profile.needed
  const inRank = !result.rankedUp && needed > 0 && needed <= MAX_SLOTS
  const before = inRank ? result.starsBefore : 0
  const slots = inRank ? needed : Math.min(gained, MAX_SLOTS)
  if (gained === 0 || slots === 0) return null
  return (
    <div className="mt-2 flex items-center justify-center gap-1" aria-hidden="true">
      {Array.from({ length: slots }, (_, i) => {
        const isNew = i >= before && i < before + gained
        return (
          <span key={i} className="relative inline-flex size-9 items-center justify-center">
            {isNew ? (
              <span className="quiz-star-new inline-flex" style={{ animationDelay: `${(i - before) * 0.18}s` }}>
                <StarShape className="size-9 drop-shadow" filled />
              </span>
            ) : (
              <StarShape className="size-8" filled={i < before} />
            )}
            {isNew && <Sparks />}
          </span>
        )
      })}
    </div>
  )
}

/** A wrong answer that costs stars: the lost ones shake, crack into shards and end up grey. */
export function StarLoss({ result }: { result: QuizResult }) {
  const lost = Math.max(0, -result.starsGained)
  const total = result.profile.needed > 0 && result.profile.needed <= MAX_SLOTS ? result.profile.needed : Math.min(result.starsBefore, MAX_SLOTS)
  const lostShown = Math.min(lost, result.starsBefore, total)
  if (lostShown === 0) return null
  const kept = Math.min(result.starsBefore, total) - lostShown
  return (
    <div className="mt-2 flex items-center justify-center gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        if (i < kept || i >= kept + lostShown) return <span key={i} className="inline-flex size-9 items-center justify-center"><StarShape className="size-8" filled={i < kept} /></span>
        const delay = `${(i - kept) * 0.2}s`
        return (
          <span key={i} className="relative inline-flex size-9 items-center justify-center">
            <span className="absolute inset-0 inline-flex items-center justify-center"><StarShape className="size-8" filled={false} /></span>
            <span className="quiz-star-lost relative inline-flex" style={{ animationDelay: delay }}><StarShape className="size-9" filled /></span>
            {Array.from({ length: 8 }, (_, k) => {
              const angle = (k / 8) * Math.PI * 2 + 0.4
              const dist = 20 + (k % 3) * 8
              return (
                <span key={k} className="quiz-shard absolute left-1/2 top-1/2" style={{ '--dx': `${Math.cos(angle) * dist}px`, '--dy': `${Math.sin(angle) * dist + 14}px`, animationDelay: `calc(${delay} + .55s)` } as React.CSSProperties}>
                  <span className="block size-1.5 rotate-45 bg-amber-400" />
                </span>
              )
            })}
          </span>
        )
      })}
    </div>
  )
}
