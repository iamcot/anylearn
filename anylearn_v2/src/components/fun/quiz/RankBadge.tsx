import { RANK_COLORS } from '@/lib/quiz/rules'

/** A medal in the colour of the rank, drawn as SVG so it looks the same on every phone. */
export default function RankBadge({ rankKey, className = 'size-16' }: { rankKey: string; className?: string }) {
  const [light, dark] = RANK_COLORS[rankKey] ?? RANK_COLORS.dong
  const id = `rank-${rankKey}`
  return (
    <svg viewBox="0 0 64 64" className={`${className} shrink-0`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <path d="M32 3l22 8v18c0 15-9 26-22 32C19 55 10 44 10 29V11z" fill={dark} />
      <path d="M32 7l18 6.5V29c0 12.5-7.5 22-18 27.5C21.5 51 14 41.500 14 29V13.500z" fill={`url(#${id})`} />
      <path d="M32 18l3.600 7.500 8.200 1.100-6 5.800 1.500 8.100L32 36.400l-7.300 4.100 1.500-8.100-6-5.800 8.200-1.100z" fill="#fff" fillOpacity=".92" stroke={dark} strokeOpacity=".5" strokeWidth="1" strokeLinejoin="round" />
      <path d="M17 14l11-4" stroke="#fff" strokeOpacity=".65" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}
