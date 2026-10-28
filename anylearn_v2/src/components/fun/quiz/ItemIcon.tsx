import type { ItemKey } from '@/lib/api/quiz'

/** Small icon of a helper item, in plain SVG. */
export default function ItemIcon({ item, className = 'size-7' }: { item: ItemKey; className?: string }) {
  const common = { viewBox: '0 0 32 32', className: `${className} shrink-0`, 'aria-hidden': true } as const
  switch (item) {
    case 'mult2':
    case 'mult3':
      return (
        <svg {...common}>
          <path d="M14 3l3.400 7.200 7.800 1-5.700 5.500 1.500 7.800L14 20.600l-7 3.900 1.500-7.800L2.800 11.200l7.800-1z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.400" strokeLinejoin="round" />
          <text x="23" y="29" textAnchor="middle" fontSize="12" fontWeight="900" fill="#0f766e" stroke="#fff" strokeWidth="2.600" paintOrder="stroke">{item === 'mult2' ? 'x2' : 'x3'}</text>
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M16 3l11 4v9c0 7.500-4.600 13-11 15.500C9.600 29 5 23.500 5 16V7z" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.600" strokeLinejoin="round" />
          <path d="M16 8v16c-4-2-7-5.500-7-9V10z" fill="#fff" fillOpacity=".45" />
        </svg>
      )
    case 'topic':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="10" height="10" rx="2.500" fill="#a78bfa" stroke="#6d28d9" strokeWidth="1.400" />
          <rect x="18" y="4" width="10" height="10" rx="2.500" fill="#f9a8d4" stroke="#be185d" strokeWidth="1.400" />
          <rect x="4" y="18" width="10" height="10" rx="2.500" fill="#86efac" stroke="#15803d" strokeWidth="1.400" />
          <rect x="18" y="18" width="10" height="10" rx="2.500" fill="#fde68a" stroke="#b45309" strokeWidth="1.400" />
        </svg>
      )
    case 'fifty':
      return (
        <svg {...common}>
          <rect x="2" y="6" width="28" height="20" rx="6" fill="#fb923c" stroke="#c2410c" strokeWidth="1.400" />
          <text x="16" y="20.500" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#fff" textLength="22" lengthAdjust="spacingAndGlyphs">50:50</text>
        </svg>
      )
    case 'community':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="5" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1.400" />
          <circle cx="22" cy="12" r="4" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="1.400" />
          <path d="M2 27c0-5 4-8.500 9-8.500s9 3.500 9 8.500z" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1.400" strokeLinejoin="round" />
          <path d="M20 19.500c4.500-.5 9 2 9 7.500h-6" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="1.400" strokeLinejoin="round" />
        </svg>
      )
    case 'time':
      return (
        <svg {...common}>
          <circle cx="16" cy="17" r="12" fill="#fff" stroke="#0f766e" strokeWidth="2" />
          <path d="M16 10v7l5 3" fill="none" stroke="#0f766e" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="12" y="2" width="8" height="3.500" rx="1.500" fill="#0f766e" />
        </svg>
      )
    case 'swap':
      return (
        <svg {...common}>
          <path d="M6 12a10 10 0 0 1 17-5l3 3" fill="none" stroke="#7c3aed" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 4v6h-6" fill="none" stroke="#7c3aed" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M26 20a10 10 0 0 1-17 5l-3-3" fill="none" stroke="#7c3aed" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 28v-6h6" fill="none" stroke="#7c3aed" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
  }
}
