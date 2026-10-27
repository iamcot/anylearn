import type { MyTier } from '@/lib/api/membership'
import { formatExactPrice } from '@/lib/format/price'

/** Share (0 to 100) of the way from this tier's threshold to the next one; 100 at the top. */
export function tierProgress(tier: MyTier): number {
  if (!tier.next) return 100
  const from = tier.tiers.find(row => row.key === tier.tier)?.minSpent ?? 0
  const to = tier.tiers.find(row => row.key === tier.next)?.minSpent ?? from
  if (to <= from) return 100
  return Math.max(0, Math.min(100, Math.round(((tier.spent12m - from) / (to - from)) * 100)))
}

export function nextTierLine(tier: MyTier): string {
  if (!tier.next || !tier.nextLabel) return 'Bạn đang ở hạng cao nhất. Cảm ơn bạn đã đồng hành cùng anyLEARN!'
  return `Còn ${formatExactPrice(tier.remaining)} nữa để lên hạng ${tier.nextLabel}`
}

export function multiplierLine(multiplier: number): string | null {
  return multiplier > 1 ? `anyPoint nhận được nhân ${multiplier.toLocaleString('vi-VN')}` : null
}

/** Colors of the tier badge: [background, text] as Tailwind classes. */
export const TIER_STYLE: Record<string, string> = {
  member: 'bg-slate-100 text-muted',
  silver: 'bg-slate-200 text-slate-700',
  gold: 'bg-amber-100 text-amber-800',
  diamond: 'bg-sky-100 text-sky-800',
}
