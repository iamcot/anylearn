import { useId } from 'react'
import { SHIELD_OUTLINE } from '@/components/fun/quiz/RankBadge'

const BODY = 'M-22 16A20 20 0 0 1-2-4L2-4A20 20 0 0 1 22 16L22 41Q22 44 19 44L-8 44A14 14 0 0 1-22 30Z'
const INK = '#0b3d22'

/**
 * Leo of the Arena: the front view of Leo with a gold rank shield in the left hand, the right hand waving and a mortarboard on his head
 * (the same SVG pieces as `Leo`, so he looks like the one on the rest of Vui học). Motion stops with reduced motion.
 */
export default function LeoArena({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="-42 -24 84 82" className={`overflow-visible ${className}`} role="img" aria-label="Leo cầm khiên rank, đội mũ tú tài">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4fe39a" /><stop offset=".55" stopColor="#00a551" /><stop offset="1" stopColor="#007a3c" /></linearGradient>
        <radialGradient id={`${id}s`} cx=".3" cy=".25" r=".5"><stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe066" /><stop offset="1" stopColor="#c98a00" /></linearGradient>
      </defs>
      <ellipse cx="0" cy="52" rx="24" ry="4.5" fill="#000" opacity=".18" />
      <g className="arena-bob">
        <rect x="-13" y="42" width="10" height="10" rx="5" fill="#007a3c" stroke={INK} strokeWidth="1.2" />
        <rect x="3" y="42" width="10" height="10" rx="5" fill="#007a3c" stroke={INK} strokeWidth="1.2" />
        <g className="arena-wave"><ellipse cx="27" cy="9" rx="5" ry="8.5" transform="rotate(28 27 9)" fill="#00a551" stroke={INK} strokeWidth="1.2" /></g>
        <ellipse cx="-24" cy="27" rx="5" ry="8" fill="#00a551" stroke={INK} strokeWidth="1.2" />
        <path d={BODY} fill={`url(#${id}b)`} />
        <ellipse cx="-9" cy="6" rx="13" ry="10" fill={`url(#${id}s)`} />
        <circle cx="-8" cy="14" r="6.5" fill="#fff" /><circle cx="8" cy="14" r="6.5" fill="#fff" />
        <circle cx="-7" cy="15" r="3.2" fill="#14342a" /><circle cx="9" cy="15" r="3.2" fill="#14342a" />
        <circle cx="-6" cy="13.8" r="1" fill="#fff" /><circle cx="10" cy="13.8" r="1" fill="#fff" />
        <ellipse cx="-15" cy="23" rx="3.5" ry="2.2" fill="#ff8fa3" opacity=".7" /><ellipse cx="15" cy="23" rx="3.5" ry="2.2" fill="#ff8fa3" opacity=".7" />
        <path d="M-5 24Q0 29 5 24" fill="none" stroke="#14342a" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M-9 33L0 36L0 43L-9 40Z" fill="#0099d4" /><path d="M9 33L0 36L0 43L9 40Z" fill="#006fa8" />
        <g transform="translate(-40 13) scale(.46)">
          <path d={SHIELD_OUTLINE} fill="#8a5a00" />
          <path d="M32 7l18 6.5V29c0 12.5-7.5 22-18 27.5C21.5 51 14 41.5 14 29V13.5z" fill={`url(#${id}g)`} />
          <path d="M32 18l3.6 7.5 8.2 1.1-6 5.8 1.5 8.1L32 36.4l-7.3 4.1 1.5-8.1-6-5.8 8.2-1.1z" fill="#fff" fillOpacity=".95" />
          <path d="M17 14l11-4" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
        <ellipse cx="-17" cy="31" rx="3.2" ry="3.6" fill="#00a551" stroke={INK} strokeWidth="1.1" />
        <path d="M-10 -9L10 -9L10 -2Q0 2 -10 -2Z" fill="#1b2a44" />
        <path d="M-20 -11L0 -18L20 -11L0 -4Z" fill="#22355a" stroke="#0d1a2e" strokeWidth="1" />
        <path d="M0 -11L15 -8.5L15.5 2" fill="none" stroke="#ffca05" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M13.8 1.5h3.4l.6 5h-4.6z" fill="#ffca05" />
        <circle cx="0" cy="-11" r="1.6" fill="#ffca05" />
      </g>
    </svg>
  )
}
