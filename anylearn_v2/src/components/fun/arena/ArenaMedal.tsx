const COLORS = [
  { face: '#ffd84d', edge: '#c98a00' },
  { face: '#e3e9f0', edge: '#7d8b9b' },
  { face: '#f0b98d', edge: '#8a4b22' },
]

/** Gold, silver or bronze medal with a red and blue ribbon and the place number (1 to 3), drawn as SVG. */
export default function ArenaMedal({ place, className = 'h-[30px] w-6' }: { place: 1 | 2 | 3; className?: string }) {
  const { face, edge } = COLORS[place - 1]
  return (
    <svg viewBox="0 0 24 30" className={`${className} shrink-0`} aria-hidden="true">
      <path d="M5 0h5l3 9H8z" fill="#e73348" />
      <path d="M19 0h-5l-3 9h5z" fill="#00539b" />
      <circle cx="12" cy="19" r="9.5" fill={edge} />
      <circle cx="12" cy="19" r="7.5" fill={face} />
      <text x="12" y="22.5" fontSize="9" fontWeight="900" textAnchor="middle" fill={edge} fontFamily="sans-serif">{place}</text>
    </svg>
  )
}
