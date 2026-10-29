/** Small coloured pictures next to the section titles of /fun, drawn as SVG so they look the same on every phone. */

/** The book of weekly missions: a closed book with a bookmark ribbon and a check mark. */
export function QuestBookIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`${className} shrink-0`} aria-hidden="true">
      <rect x="6" y="4" width="21" height="25" rx="3" fill="#b45309" />
      <rect x="5" y="3" width="21" height="25" rx="3" fill="#f59e0b" stroke="#92400e" strokeWidth="1.4" />
      <rect x="5" y="3" width="4.5" height="25" rx="2" fill="#d97706" />
      <path d="M20 3v9l2.5-2 2.5 2V3z" fill="#ef4444" stroke="#991b1b" strokeWidth="1" strokeLinejoin="round" />
      <path d="M12.5 17.5l2.6 2.6 5.4-5.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A gold cup for "Thành tích của tôi". */
export function TrophyIcon({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`${className} shrink-0`} aria-hidden="true">
      <defs>
        <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset=".5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path d="M9 7H4.5v3a5 5 0 0 0 5 5M23 7h4.5v3a5 5 0 0 1-5 5" fill="none" stroke="#d97706" strokeWidth="2.2" />
      <path d="M8 4h16v7a8 8 0 0 1-16 0z" fill="url(#trophyGold)" stroke="#b45309" strokeWidth="1.4" />
      <path d="M14 18.5h4v4.5h-4z" fill="#d97706" />
      <rect x="10" y="23" width="12" height="5" rx="1.5" fill="#92400e" />
      <path d="M16 6.8l1.2 2.5 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" fill="#fff7d6" />
      <path d="M10.5 6v4" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
