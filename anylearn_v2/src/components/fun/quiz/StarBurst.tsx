import type { QuizResult } from '@/lib/api/quiz'

const MAX_SLOTS = 15
const SPARKS = 14
/** Seconds between two stars of the same answer: they change one after the other, never together. */
export const STAR_STEP = 0.4

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
function Sparks({ delay }: { delay: number }) {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * Math.PI * 2 + (i % 2) * 0.2
        const dist = 38 + (i % 3) * 12
        return (
          <span
            key={i}
            className="quiz-spark absolute left-1/2 top-1/2"
            style={{ '--dx': `${Math.cos(angle) * dist}px`, '--dy': `${Math.sin(angle) * dist}px`, animationDelay: `${delay + 0.25 + (i % 4) * 0.04}s` } as React.CSSProperties}
          >
            {i % 2 === 0 ? <StarShape className="size-3" filled /> : <span className="block size-1.5 rounded-full bg-amber-300" />}
          </span>
        )
      })}
    </span>
  )
}

/** Shards of a star that breaks. */
function Shards({ delay }: { delay: number }) {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 8 }, (_, k) => {
        const angle = (k / 8) * Math.PI * 2 + 0.4
        const dist = 20 + (k % 3) * 8
        return (
          <span
            key={k}
            className="quiz-shard absolute left-1/2 top-1/2"
            style={{ '--dx': `${Math.cos(angle) * dist}px`, '--dy': `${Math.sin(angle) * dist + 14}px`, animationDelay: `${delay + 0.55}s` } as React.CSSProperties}
          >
            <span className="block size-1.5 rotate-45 bg-amber-400" />
          </span>
        )
      })}
    </span>
  )
}

/** How many stars change in this answer (new gold stars on a win, broken ones on a loss). */
export function changedStars(result: QuizResult): number {
  if (result.correct) return result.rankedUp ? result.profile.stars : Math.max(0, result.starsGained)
  return result.starsGained < 0 ? -result.starsGained : 0
}

/**
 * The row of stars of the rank the player ends in: gold for the stars they have, grey for the empty slots.
 * Win: the new gold stars replace grey ones one by one (pop, bounce twice, sparks). Loss: the lost gold stars shake,
 * break into shards and become grey. A rank change just shows the new rank's row (1 gold on the way up, max - 1 gold on the way down).
 */
export default function StarRow({ result }: { result: QuizResult }) {
  const profile = result.profile
  const slots = profile.needed > 0 ? Math.min(profile.needed, MAX_SLOTS) : Math.min(Math.max(profile.stars, 1), MAX_SLOTS)
  const gold = Math.min(profile.stars, slots)
  const changed = result.correct ? changedStars(result) : 0
  const lost = !result.correct && !result.rankedDown ? Math.min(-Math.min(result.starsGained, 0), slots - gold) : 0
  const firstNew = gold - Math.min(changed, gold)
  const size = slots > 8 ? 'size-6' : 'size-8'
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1" aria-hidden="true">
      {Array.from({ length: slots }, (_, i) => {
        const wrap = `relative inline-flex ${slots > 8 ? 'size-7' : 'size-9'} items-center justify-center`
        if (i >= firstNew && i < gold && changed > 0) {
          const delay = (i - firstNew) * STAR_STEP
          return (
            <span key={i} className={wrap}>
              <span className="absolute inset-0 inline-flex items-center justify-center"><StarShape className={size} filled={false} /></span>
              <span className="quiz-star-new relative inline-flex" style={{ animationDelay: `${delay}s` }}><StarShape className={`${size} drop-shadow`} filled /></span>
              <Sparks delay={delay} />
            </span>
          )
        }
        if (i >= gold && i < gold + lost) {
          const delay = (i - gold) * STAR_STEP
          return (
            <span key={i} className={wrap}>
              <span className="absolute inset-0 inline-flex items-center justify-center"><StarShape className={size} filled={false} /></span>
              <span className="quiz-star-lost relative inline-flex" style={{ animationDelay: `${delay}s` }}><StarShape className={size} filled /></span>
              <Shards delay={delay} />
            </span>
          )
        }
        return <span key={i} className={wrap}><StarShape className={size} filled={i < gold} /></span>
      })}
    </div>
  )
}
