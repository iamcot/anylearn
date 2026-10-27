import { useId } from 'react'

const COINS: Record<string, { light: string; dark: string; ring: string }> = {
  silver: { light: '#f1f5f9', dark: '#94a3b8', ring: '#64748b' },
  gold: { light: '#fde68a', dark: '#f59e0b', ring: '#b45309' },
}

/** The member tier as a picture: a silver or gold coin, a blue diamond. Members and unknown tiers show nothing. */
export default function TierIcon({ tier, label, className = 'size-5' }: { tier?: string | null; label?: string; className?: string }) {
  const id = useId()
  if (tier === 'diamond') {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-label={label ?? 'Kim cương'} className={`inline-block shrink-0 ${className}`}>
        <title>{label ?? 'Kim cương'}</title>
        <path d="M6 3h12l4 6-10 12L2 9z" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M2 9h20M9 3l-2 6 5 12M15 3l2 6-5 12" fill="none" stroke="#e0f2fe" strokeWidth="1" strokeLinejoin="round" />
        <path d="M6 3l3 6h6l3-6" fill="#7dd3fc" opacity=".8" />
      </svg>
    )
  }
  const coin = tier ? COINS[tier] : undefined
  if (!coin) return null
  const name = label ?? (tier === 'gold' ? 'Vàng' : 'Bạc')
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={name} className={`inline-block shrink-0 ${className}`}>
      <title>{name}</title>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={coin.light} />
          <stop offset="1" stopColor={coin.dark} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10.5" fill={`url(#${id})`} stroke={coin.ring} strokeWidth="1.2" />
      <circle cx="12" cy="12" r="7.6" fill="none" stroke={coin.ring} strokeWidth=".9" opacity=".6" />
      <path d="M12 7.2l1.35 2.9 3.15.4-2.3 2.2.6 3.1L12 14.2l-2.8 1.6.6-3.1-2.3-2.2 3.15-.4z" fill={coin.ring} opacity=".75" />
    </svg>
  )
}
