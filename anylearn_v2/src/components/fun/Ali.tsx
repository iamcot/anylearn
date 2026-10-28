// "Ali", the mascot of anyLEARN, drawn from the logo: the round "a" with one square corner and the blue book inside.
// Kept as separate pieces so Ali can later pop out anywhere on the site as a guide (planned, not built yet):
//   <Ali />          the character (SVG, walks and blinks by CSS classes `ali-*` in globals.css)
//   <AliBubble ... /> the speech bubble that comes out of his mouth
export function Ali({ walking = true, className = '' }: { walking?: boolean; className?: string }) {
  const move = walking ? '' : 'ali-still'
  return (
    <svg viewBox="-30 -8 60 64" className={`${move} ${className}`} aria-label="Ali" role="img">
      <ellipse cx="0" cy="52" rx="24" ry="4.5" fill="#000" opacity=".14" />
      <g className="ali-bob">
        <g className="ali-leg-a"><rect x="-13" y="42" width="10" height="10" rx="5" fill="#007a3c" /></g>
        <g className="ali-leg-b"><rect x="3" y="42" width="10" height="10" rx="5" fill="#007a3c" /></g>
        <g className="ali-arm-a"><ellipse cx="-24" cy="26" rx="5" ry="8" fill="#00a551" /></g>
        <g className="ali-arm-b"><ellipse cx="24" cy="26" rx="5" ry="8" fill="#00a551" /></g>
        <defs>
          <linearGradient id="aliBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4fe39a" /><stop offset=".55" stopColor="#00a551" /><stop offset="1" stopColor="#007a3c" />
          </linearGradient>
          <radialGradient id="aliShine" cx=".3" cy=".25" r=".5">
            <stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M-22 16A20 20 0 0 1-2-4L2-4A20 20 0 0 1 22 16L22 41Q22 44 19 44L-8 44A14 14 0 0 1-22 30Z" fill="url(#aliBody)" />
        <ellipse cx="-9" cy="6" rx="13" ry="10" fill="url(#aliShine)" />
        <circle cx="-8" cy="14" r="6.5" fill="#fff" /><circle cx="8" cy="14" r="6.5" fill="#fff" />
        <g className="ali-eyes">
          <circle cx="-7" cy="15" r="3.2" fill="#14342a" /><circle cx="9" cy="15" r="3.2" fill="#14342a" />
          <circle cx="-6" cy="13.8" r="1" fill="#fff" /><circle cx="10" cy="13.8" r="1" fill="#fff" />
        </g>
        <ellipse cx="-15" cy="23" rx="3.5" ry="2.2" fill="#ff8fa3" opacity=".7" /><ellipse cx="15" cy="23" rx="3.5" ry="2.2" fill="#ff8fa3" opacity=".7" />
        <path d="M-4 24Q0 28 4 24" fill="none" stroke="#14342a" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M-9 33L0 36L0 43L-9 40Z" fill="#0099d4" /><path d="M9 33L0 36L0 43L9 40Z" fill="#006fa8" />
      </g>
    </svg>
  )
}

/** The words of Ali in a bubble with its tail pointing down at his face. Change `text` and the bubble pops in again. */
export function AliBubble({ text }: { text: string }) {
  return (
    <div key={text} role="status" className="ali-pop absolute bottom-full left-[-6px] mb-1 w-max max-w-[190px] rounded-2xl bg-white px-3 py-2 text-left text-[13px] font-semibold leading-snug text-ink shadow-[0_4px_14px_rgba(0,0,0,.16)]">
      {text}
      <span className="absolute -bottom-1.5 left-9 size-3 rotate-45 bg-white" aria-hidden />
    </div>
  )
}
