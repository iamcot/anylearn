// SVG pictures of anyLEARN Foundation (no emoji: they look different on every phone).

/** A small school toilet house: roof, brick wall, green door. `muted` = the one not built yet (outline only). */
export function HouseIcon({ className = 'size-6', muted = false }: { className?: string; muted?: boolean }) {
  if (muted) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path d="M2.5 11 12 3.5l9.5 7.5" fill="none" stroke="#c9ced6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="5" y="10.5" width="14" height="10.5" rx="1" fill="#fff" stroke="#c9ced6" strokeWidth="1.6" strokeDasharray="2.4 1.8" />
        <rect x="10" y="14" width="4" height="7" rx=".8" fill="#e6e9ee" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M1.8 11.4 12 3l10.2 8.4a1 1 0 0 1-1.3 1.5L12 5.6l-8.9 7.3a1 1 0 0 1-1.3-1.5Z" fill="#e85d3f" />
      <path d="M4.5 11.2 12 5.2l7.5 6V21a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1Z" fill="#c8643b" />
      <path d="M4.5 14.5h15M4.5 18h15M8 11.6v2.9M16 11.6v2.9M12 14.5V18M8 18v3.8M16 18v3.8" stroke="#a44d2a" strokeWidth=".7" />
      <rect x="10" y="15.2" width="4" height="6.8" rx=".8" fill="#00a551" />
    </svg>
  )
}

/** One brick. */
export function BrickIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3 9.5 8 6h13l-5 3.5Z" fill="#e08a5f" />
      <path d="M16 9.5 21 6v8.5L16 18Z" fill="#a44d2a" />
      <rect x="3" y="9.5" width="13" height="8.5" rx=".6" fill="#c8643b" />
      <path d="M3 13.75h13M9.5 9.5v4.25" stroke="#a44d2a" strokeWidth=".8" />
    </svg>
  )
}
