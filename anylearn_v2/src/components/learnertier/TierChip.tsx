import type { LearnerTier } from '@/lib/api/gamification'

/** Small learner-tier chip (icon + name) next to a learner's name. */
export default function TierChip({ tier }: { tier?: LearnerTier }) {
  if (!tier) return null
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-soft px-2 py-0.5 text-[11px] font-extrabold text-green">
      <span aria-hidden>{tier.icon}</span>{tier.label}
    </span>
  )
}
