import { RANK_COLORS } from '@/lib/quiz/rules'

const ORDER = ['dong', 'bac', 'vang', 'bachkim', 'kimcuong', 'thongthai', 'sieupham', 'huyenthoai']
/** The shield outline of a rank medal, shared with the Arena's Leo. */
export const SHIELD_OUTLINE = 'M32 3l22 8v18c0 15-9 26-22 32C19 55 10 44 10 29V11z'
const OUTLINE = SHIELD_OUTLINE

/**
 * A medal in the colour of the rank, drawn as SVG so it looks the same on every phone.
 * The higher the rank, the stronger the effects: a lit rim (from silver), a glow, and a band of light sweeping across (faster and wider each rank).
 */
export default function RankBadge({ rankKey, className = 'size-16' }: { rankKey: string; className?: string }) {
  const [light, dark] = RANK_COLORS[rankKey] ?? RANK_COLORS.dong
  const id = `rank-${rankKey}`
  const tier = Math.max(0, ORDER.indexOf(rankKey))
  const glow = tier === 0 ? undefined : `drop-shadow(0 0 ${1 + tier * 0.7}px ${light})`
  const bandWidth = 6 + tier * 2
  const duration = (4.2 - tier * 0.4).toFixed(1)
  return (
    <svg viewBox="0 0 64 64" className={`${className} shrink-0 overflow-visible`} style={glow ? { filter: glow } : undefined} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity={0.55 + tier * 0.05} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}><path d={OUTLINE} /></clipPath>
      </defs>
      <path d={OUTLINE} fill={dark} />
      <path d="M32 7l18 6.5V29c0 12.5-7.5 22-18 27.5C21.5 51 14 41.500 14 29V13.500z" fill={`url(#${id})`} />
      <path d="M32 18l3.600 7.500 8.200 1.100-6 5.800 1.500 8.100L32 36.400l-7.300 4.100 1.500-8.100-6-5.800 8.200-1.100z" fill="#fff" fillOpacity=".92" stroke={dark} strokeOpacity=".5" strokeWidth="1" strokeLinejoin="round" />
      <path d="M17 14l11-4" stroke="#fff" strokeOpacity=".65" strokeWidth="2" strokeLinecap="round" fill="none" />
      {tier > 0 && (
        <>
          <path d={OUTLINE} fill="none" stroke={light} strokeWidth={1 + tier * 0.45} strokeLinejoin="round" strokeOpacity=".95" />
          <g clipPath={`url(#${id}-clip)`}>
            <rect className="rank-shine" x={-bandWidth} y="-8" width={bandWidth} height="80" fill={`url(#${id}-band)`} style={{ animationDuration: `${duration}s` }} transform="skewX(-20)" />
          </g>
        </>
      )}
    </svg>
  )
}
