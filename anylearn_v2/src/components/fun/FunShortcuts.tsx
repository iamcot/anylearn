import Link from 'next/link'
import type { FunAccess } from '@/lib/api/fun'

interface Shortcut { href: string; image: string; label: string; game?: keyof FunAccess }

// The shop sells for several games, so it has no access switch of its own (fun/enabled and shop/enabled close it on the server).
const SHORTCUTS: Shortcut[] = [
  { href: '/fun/shop', image: '/fun/leo_shop.png', label: 'Cửa hàng' },
  { href: '/fun/quiz', image: '/fun/leo_rank.png', label: 'Leo rank', game: 'quiz' },
  { href: '/fun/sticker', image: '/fun/leo_sticker.png', label: 'Sticker', game: 'sticker' },
  { href: '/fun/explore', image: '/fun/leo_discovery.png', label: 'Khám phá', game: 'explore' },
]

/** The four main places of Vui học as Leo pictures with a green outlined label under each; a game closed to the person is left out. */
export default function FunShortcuts({ access }: { access: FunAccess | null }) {
  const shown = SHORTCUTS.filter(s => !s.game || access?.[s.game] !== false)
  // every game closed: the page says Vui học is being tried out, a shop alone would lead nowhere
  if (!shown.some(s => s.game)) return null
  return (
    <nav aria-label="Lối tắt Vui học" className="mt-4 grid grid-cols-4 gap-2">
      {shown.map(s => (
        <Link key={s.href} href={s.href} className="flex flex-col items-center gap-1.5 text-center no-underline">
          <img src={s.image} alt="" className="size-[72px] object-contain [filter:drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_3px_rgba(255,255,255,.9))_drop-shadow(0_3px_4px_rgba(15,23,42,.22))] lg:size-24" />
          <span className="whitespace-nowrap text-[13px] font-black text-[#15803d] [-webkit-text-stroke:3px_#fff] [paint-order:stroke_fill] [text-shadow:0_1px_2px_rgba(15,23,42,.18)]">{s.label}</span>
        </Link>
      ))}
    </nav>
  )
}
