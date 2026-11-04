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

/** A bucket of bricks. */
export function BucketIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M6 8.5h12" stroke="#7a8794" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6.5 6.5c0-3 11-3 11 0" fill="none" stroke="#7a8794" strokeWidth="1.3" />
      <rect x="7" y="5.8" width="4.5" height="2.8" rx=".4" fill="#c8643b" />
      <rect x="12" y="5.4" width="4.5" height="3.2" rx=".4" fill="#e08a5f" />
      <path d="M5 8.5h14l-1.6 12a1.2 1.2 0 0 1-1.2 1H7.8a1.2 1.2 0 0 1-1.2-1Z" fill="#9aa7b4" />
      <path d="M5.6 12.5h12.8" stroke="#7a8794" strokeWidth=".8" />
    </svg>
  )
}

/** A can of paint with a drip. */
export function PaintIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 6.5c0-3.4 10-3.4 10 0" fill="none" stroke="#5b6672" strokeWidth="1.3" />
      <ellipse cx="12" cy="7" rx="7" ry="2" fill="#2f80ed" />
      <path d="M5 7v12.5c0 1.2 3.1 2 7 2s7-.8 7-2V7c0 1.1-3.1 2-7 2s-7-.9-7-2Z" fill="#d6dde5" />
      <path d="M5 7c0 1.1 3.1 2 7 2s7-.9 7-2v3.2c0 .7-.9 1-.9 2.2 0 .7-.9.7-.9 0 0-1-1.5-1.1-3.2-1.1H5Z" fill="#2f80ed" />
      <rect x="8" y="13" width="8" height="5" rx=".8" fill="#fff" />
      <path d="M9.5 15.5h5" stroke="#2f80ed" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** A bag of cement. */
export function CementIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M5.5 4.5h13l1 2.2-1 .8 1.2 12a1.3 1.3 0 0 1-1.3 1.5H5.6a1.3 1.3 0 0 1-1.3-1.5l1.2-12-1-.8Z" fill="#c9b79a" />
      <path d="M5.5 4.5h13l1 2.2H4.5Z" fill="#b29f80" />
      <rect x="7.5" y="10" width="9" height="6.5" rx=".8" fill="#f2ead9" />
      <path d="M9 12.2h6M9 14.4h4" stroke="#8a7656" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

/** A wheelbarrow of bricks. */
export function BarrowIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5.5" y="6.5" width="4.5" height="3" rx=".4" fill="#c8643b" />
      <rect x="10.5" y="6" width="4.5" height="3.5" rx=".4" fill="#e08a5f" />
      <path d="M3 9.5h14l-2.5 6H6Z" fill="#00a551" />
      <path d="m17 9.5 4-3" stroke="#5b6672" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 15.5 7 20M13 15.5l1.5 2" stroke="#5b6672" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="15.5" cy="18.5" r="2.2" fill="#3a4450" />
      <circle cx="15.5" cy="18.5" r=".8" fill="#c9ced6" />
    </svg>
  )
}

/** A truck loaded with bricks. */
export function TruckIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="2.5" y="7" width="4" height="3" rx=".4" fill="#c8643b" />
      <rect x="7" y="6.6" width="4" height="3.4" rx=".4" fill="#e08a5f" />
      <rect x="2" y="10" width="12" height="6" rx=".8" fill="#f2a63b" />
      <path d="M14 10h4.2l3.3 3.6V16a.6.6 0 0 1-.6.6H14Z" fill="#2f80ed" />
      <path d="M15.4 11.2h2.4l1.9 2.1h-4.3Z" fill="#cfe3ff" />
      <circle cx="6" cy="17.5" r="2" fill="#3a4450" />
      <circle cx="17.5" cy="17.5" r="2" fill="#3a4450" />
      <circle cx="6" cy="17.5" r=".7" fill="#c9ced6" />
      <circle cx="17.5" cy="17.5" r=".7" fill="#c9ced6" />
    </svg>
  )
}

/** The picture of a contribution label ("1 xô gạch", "1 thùng sơn"...): brick by default. */
export function ContributionIcon({ label, className = 'size-5' }: { label?: string | null; className?: string }) {
  const l = (label ?? '').toLowerCase()
  if (l.includes('xe tải')) return <TruckIcon className={className} />
  if (l.includes('xe rùa')) return <BarrowIcon className={className} />
  if (l.includes('xi măng')) return <CementIcon className={className} />
  if (l.includes('sơn')) return <PaintIcon className={className} />
  if (l.includes('xô')) return <BucketIcon className={className} />
  return <BrickIcon className={className} />
}
