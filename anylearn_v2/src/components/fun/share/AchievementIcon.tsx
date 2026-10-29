import { bannerStyle } from '@/lib/achievements/share'
import { RANK_COLORS } from '@/lib/quiz/rules'

/** The picture of an achievement (rank medal, streak flame or star), drawn the same in the PNG banner and in the lists. */
export default function AchievementIcon({ icon, size }: { icon: string; size: number }) {
  const { kind, key } = bannerStyle(icon)
  const [light, dark] = RANK_COLORS[key] ?? RANK_COLORS.dong
  if (kind === 'streak') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <path d="M32 4c2 10 14 16 14 32a14 14 0 0 1-28 0c0-8 4-12 7-16 1 5 3 7 5 8-1-8 0-17 2-24z" fill={dark} />
        <path d="M32 24c1 6 8 9 8 18a8 8 0 0 1-16 0c0-5 3-7 5-10 1 3 2 4 3 4-1-4-1-8 0-12z" fill={light} />
      </svg>
    )
  }
  if (kind === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <path d="M32 4l8.500 17.500 19 2.700-13.800 13.400 3.300 19L32 47.500 15 56.600l3.300-19L4.500 24.200l19-2.700z" fill={dark} />
        <path d="M32 11l6.200 12.800 14 2-10.100 9.800 2.400 13.900L32 42.900 19.500 49.500l2.400-13.900L11.800 25.800l14-2z" fill={light} />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M32 3l22 8v18c0 15-9 26-22 32C19 55 10 44 10 29V11z" fill={dark} />
      <path d="M32 7l18 6.500V29c0 12.500-7.500 22-18 27.500C21.500 51 14 41.500 14 29V13.500z" fill={light} />
      <path d="M32 18l3.600 7.500 8.200 1.100-6 5.800 1.500 8.100L32 36.400l-7.300 4.100 1.500-8.100-6-5.800 8.200-1.100z" fill="#ffffff" />
    </svg>
  )
}
