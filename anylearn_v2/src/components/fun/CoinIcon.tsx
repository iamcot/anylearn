/** The game coin drawn as SVG so it is the same gold on every device (the emoji changes with the phone). */
export default function CoinIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`${className} shrink-0`} aria-hidden="true">
      <defs>
        <linearGradient id="coinFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe27a" />
          <stop offset=".55" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="#b45309" />
      <circle cx="16" cy="16" r="13.2" fill="url(#coinFace)" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#b45309" strokeOpacity=".45" strokeWidth="1.4" />
      <path d="M16 8.5l1.9 5.3h5.4l-4.4 3.2 1.7 5.2-4.6-3.3-4.6 3.3 1.7-5.2-4.4-3.2h5.4z" fill="#fff7d6" stroke="#b45309" strokeOpacity=".5" strokeWidth=".8" strokeLinejoin="round" />
      <path d="M8 11a9.5 9.5 0 0 1 6-4" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
