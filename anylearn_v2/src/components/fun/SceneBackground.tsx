// Background of the Vui học scene. It is its own component so the back office can offer other looks later
// (by topic or season): add a theme to SCENE_THEMES and pass its key. Only "day" exists for now.
export type SceneTheme = 'day'

interface Palette { skyTop: string; skyBottom: string; sun: string; glow: string; hillFar: string; hillNear: string }

export const SCENE_THEMES: Record<SceneTheme, Palette> = {
  day: { skyTop: '#8fd3f4', skyBottom: '#e9f7ff', sun: '#ffd166', glow: '#fff3c4', hillFar: '#9bd77f', hillNear: '#6cbf5a' },
}

// Rays leave the sun (300, 38) and fan out to the bottom of the scene; two layers sway in opposite ways.
const RAYS_WIDE = ['300,38 40,230 120,230', '300,38 170,230 250,230', '300,38 290,230 350,230']
const RAYS_THIN = ['300,38 90,230 125,230', '300,38 210,230 235,230', '300,38 250,230 270,230', '300,38 330,230 360,230']

export default function SceneBackground({ theme = 'day' }: { theme?: SceneTheme }) {
  const p = SCENE_THEMES[theme]
  return (
    <svg viewBox="0 0 360 230" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sceneSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} /><stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor={p.glow} stopOpacity=".95" /><stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rayFade" gradientUnits="userSpaceOnUse" x1="300" y1="38" x2="170" y2="230">
          <stop offset="0" stopColor="#fff" stopOpacity=".6" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="360" height="230" fill="url(#sceneSky)" />
      <g className="sun-rays-a" opacity=".55">{RAYS_WIDE.map(points => <polygon key={points} points={points} fill="url(#rayFade)" />)}</g>
      <g className="sun-rays-b" opacity=".45">{RAYS_THIN.map(points => <polygon key={points} points={points} fill="url(#rayFade)" />)}</g>
      <g className="sun-glow">
        <circle cx="300" cy="38" r="78" fill="url(#sunGlow)" opacity=".5" />
        <circle cx="300" cy="38" r="52" fill="url(#sunGlow)" opacity=".7" />
        <circle cx="300" cy="38" r="34" fill="url(#sunGlow)" />
      </g>
      <circle cx="300" cy="38" r="19" fill={p.sun} />
      <path d="M0 160 Q90 120 190 155 T360 145 V230 H0Z" fill={p.hillFar} />
      <path d="M0 185 Q120 150 230 182 T360 175 V230 H0Z" fill={p.hillNear} />
    </svg>
  )
}
