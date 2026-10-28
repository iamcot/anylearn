import { useEffect, useState, useSyncExternalStore } from 'react'

// "Ali", the mascot of anyLEARN, drawn from the logo: the round "a" with one square corner and the blue book inside.
// Kept as separate pieces so Ali can later pop out anywhere on the site as a guide (planned, not built yet):
//   <Ali />          the character (SVG with front, right and left views; limbs move by CSS classes `ali-*` in globals.css)
//   useAliWalk()     the walk cycle that picks the view and the position
//   <AliBubble ... /> the speech bubble that comes out of his mouth
export type AliView = 'front' | 'right' | 'left'

const BODY = 'M-22 16A20 20 0 0 1-2-4L2-4A20 20 0 0 1 22 16L22 41Q22 44 19 44L-8 44A14 14 0 0 1-22 30Z'

function Defs() {
  return (
    <defs>
      <linearGradient id="aliBody" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4fe39a" /><stop offset=".55" stopColor="#00a551" /><stop offset="1" stopColor="#007a3c" />
      </linearGradient>
      <radialGradient id="aliShine" cx=".3" cy=".25" r=".5">
        <stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

function Front({ moving, waving }: { moving: boolean; waving: boolean }) {
  return (
    <g className={moving ? '' : 'ali-still'}>
      <g className="ali-bob">
        <g className="ali-leg-a"><rect x="-13" y="42" width="10" height="10" rx="5" fill="#007a3c" /></g>
        <g className="ali-leg-b"><rect x="3" y="42" width="10" height="10" rx="5" fill="#007a3c" /></g>
        <g className="ali-arm-a"><ellipse cx="-24" cy="26" rx="5" ry="8" fill="#00a551" /></g>
        <g className={waving ? 'ali-wave' : 'ali-arm-b'}><ellipse cx="24" cy="26" rx="5" ry="8" fill="#00a551" /></g>
        <path d={BODY} fill="url(#aliBody)" />
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
    </g>
  )
}

// Side view facing right (the left view is this one mirrored): narrower body, face turned to the front edge,
// one arm and one leg behind, the stride moves the legs forward and back.
function Side() {
  return (
    <g>
      <g className="ali-bob">
        <g className="ali-arm-b"><ellipse cx="-9" cy="27" rx="4.5" ry="7.5" fill="#007a3c" /></g>
        <g className="ali-stride-b"><rect x="-9" y="42" width="10" height="10" rx="5" fill="#006a33" /></g>
        <g className="ali-stride-a"><rect x="-1" y="42" width="11" height="10" rx="5" fill="#007a3c" /></g>
        <g transform="scale(.8 1)">
          <path d={BODY} fill="url(#aliBody)" />
          <ellipse cx="-9" cy="6" rx="13" ry="10" fill="url(#aliShine)" />
        </g>
        <circle cx="4" cy="14" r="6.2" fill="#fff" /><circle cx="13.5" cy="14.5" r="5" fill="#fff" />
        <g className="ali-eyes">
          <circle cx="6" cy="15" r="3" fill="#14342a" /><circle cx="15" cy="15.3" r="2.6" fill="#14342a" />
          <circle cx="6.9" cy="13.9" r=".9" fill="#fff" /><circle cx="15.7" cy="14.2" r=".8" fill="#fff" />
        </g>
        <ellipse cx="3" cy="23.5" rx="3" ry="2" fill="#ff8fa3" opacity=".7" />
        <path d="M7 24Q11 28.5 15 24" fill="none" stroke="#14342a" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M6 34L13 36L13 42L6 40Z" fill="#0099d4" />
        <g className="ali-arm-a"><ellipse cx="1" cy="27" rx="5" ry="8" fill="#00a551" /></g>
      </g>
    </g>
  )
}

/** The character. `view` picks front, right or left (the side views are drawn, not a flipped front); `moving` runs the limbs. */
export function Ali({ view = 'front', moving = false, waving = false, className = '' }: { view?: AliView; moving?: boolean; waving?: boolean; className?: string }) {
  return (
    <svg viewBox="-30 -8 60 64" className={className} style={{ overflow: "visible", ...(view === "left" ? { transform: "scaleX(-1)" } : {}) }} aria-label="Ali" role="img">
      <ellipse cx="0" cy="52" rx="24" ry="4.5" fill="#000" opacity=".14" />
      <Defs />
      {view === 'front' ? <Front moving={moving} waving={waving} /> : <Side />}
    </svg>
  )
}

const WALK_MS = 5000
const PAUSE_MS = 1800
const QUIET = '(prefers-reduced-motion: reduce)'

function subscribeQuiet(listener: () => void) {
  const query = window.matchMedia(QUIET)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}

/**
 * Ali's walk: right with the right side view, stop at the end facing front and wave, then left with the left side view,
 * stop and wave again. `atEnd` says which end he is walking to (drives the CSS transition), `walkMs` its duration.
 */
export function useAliWalk() {
  const reduced = useSyncExternalStore(subscribeQuiet, () => window.matchMedia(QUIET).matches, () => true)
  const [step, setStep] = useState(3) // starts waiting at the left end
  useEffect(() => {
    if (reduced) return
    const id = setTimeout(() => setStep(s => (s + 1) % 4), step === 0 || step === 2 ? WALK_MS : PAUSE_MS)
    return () => clearTimeout(id)
  }, [step, reduced])
  if (reduced) return { view: 'front' as AliView, moving: false, waving: false, atEnd: false, walkMs: 0 }
  return {
    view: (step === 0 ? 'right' : step === 2 ? 'left' : 'front') as AliView,
    moving: step === 0 || step === 2,
    waving: step === 1 || step === 3,
    atEnd: step === 0 || step === 1,
    walkMs: WALK_MS,
  }
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
